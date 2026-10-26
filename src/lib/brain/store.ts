import { randomUUID } from "node:crypto";
import type { CurrentUser } from "@/lib/auth/currentUser";
import { observeEngine } from "@/lib/engine/observe";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { EXTRACT_MODEL, aiConfigured, extractBoard } from "@/lib/ai/extract";
import { logAiCall } from "@/lib/ai/log";
import { headlinesFrom, toProposedCards } from "@/lib/ai/proposedCards";
import { backfillTranscripts } from "./answerStore";
import { assemble } from "./assemble";
import { brainFor } from "./brainId";
import { DEEP_DIVE_QUESTIONS } from "./questions";
import { sampleBrain } from "./sampleBrain";
import type { Brain, Card, SourceAnswer } from "./schema";
import {
  ANSWER_COLUMNS,
  BRAIN_COLUMNS,
  CARD_COLUMNS,
  blankBrain,
  brainColumns,
  cardColumns,
  toBrain,
  type AnswerRow,
  type BrainFields,
  type BrainRow,
  type CardRow,
} from "./savedBrain";

/**
 * Where the brain is read and written. Without Supabase it's Maya's sample brain, which the
 * browser holds as before; with it, the signed-in person's own, through row level security.
 * Server only.
 */

/** The person's brain, cards and deep-dive answers included. */
export async function loadBrain(user: CurrentUser): Promise<Brain> {
  if (!supabaseConfigured) {
    // Dev only: SAMPLE_BRAIN=new shows what a brand-new person sees, without signing anyone up.
    if (process.env.SAMPLE_BRAIN === "new") return blankBrain(sampleBrain.id);
    return { ...sampleBrain, observed: observeEngine(sampleBrain.answers) };
  }
  const id = await brainFor(user);
  const supabase = await createClient();
  const [brain, cards, answers] = await Promise.all([
    supabase.from("brains").select(BRAIN_COLUMNS).eq("id", id).single(),
    supabase.from("cards").select(CARD_COLUMNS).eq("brain_id", id).order("created_at"),
    supabase.from("answers").select(ANSWER_COLUMNS).eq("brain_id", id),
  ]);
  for (const result of [brain, cards, answers]) if (result.error) throw new Error(result.error.message);
  return toBrain(
    brain.data as unknown as BrainRow,
    (cards.data ?? []) as unknown as CardRow[],
    (answers.data ?? []) as unknown as AnswerRow[]
  );
}

export async function saveBrainFields(user: CurrentUser, fields: BrainFields): Promise<void> {
  const id = await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase.from("brains").update(brainColumns(fields)).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Adds the card or saves over it. Its source answer is set when the board is built and never changes here. */
export async function saveCard(user: CurrentUser, card: Card): Promise<void> {
  const brainId = await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase.from("cards").upsert({ id: card.id, brain_id: brainId, ...cardColumns(card) }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteCard(user: CurrentUser, cardId: string): Promise<void> {
  const brainId = await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", cardId).eq("brain_id", brainId);
  if (error) throw new Error(error.message);
}

/**
 * Builds the board from their saved deep-dive answers, replacing every card, and returns the new
 * brain. The engine and status come from the rules in assemble(); the cards and headline options
 * from Claude when ANTHROPIC_API_KEY is set, or one card per answer when it isn't (or Claude fails).
 */
export async function assembleBrain(user: CurrentUser): Promise<Brain> {
  // Voice notes saved before their transcript came back are written out first, so every word counts.
  await backfillTranscripts(await brainFor(user));
  const brain = await loadBrain(user);
  const deepDive = new Set(DEEP_DIVE_QUESTIONS.map((q) => q.id));
  const answers = brain.answers.filter((a) => deepDive.has(a.questionId));
  let next = assemble(brain, answers, () => randomUUID());
  if (aiConfigured() && answers.length) next = await withClaudesBoard(next, answers);

  const supabase = await createClient();
  const cleared = await supabase.from("cards").delete().eq("brain_id", brain.id);
  if (cleared.error) throw new Error(cleared.error.message);
  if (next.cards.length) {
    const start = Date.now();
    const { error } = await supabase.from("cards").insert(
      next.cards.map((card, i) => ({
        id: card.id,
        brain_id: brain.id,
        source_answer_id: card.sourceAnswerId ?? null,
        ...cardColumns(card),
        created_at: new Date(start + i).toISOString(), // keeps the deep dive's order on the board
      }))
    );
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase
    .from("brains")
    .update({
      deep_dive_status: "assembled",
      engine_primary: next.enginePrimary,
      engine_secondary: next.engineSecondary ?? null,
      headline_options: next.headlineOptions,
    })
    .eq("id", brain.id);
  if (error) throw new Error(error.message);
  return next;
}

/** Claude's proposed cards and headlines in place of one card per answer. Logged either way. */
async function withClaudesBoard(board: Brain, answers: SourceAnswer[]): Promise<Brain> {
  const inputIds = answers.map((a) => a.id);
  try {
    const { output, model, usage } = await extractBoard(answers);
    const cards = toProposedCards(output, answers, () => randomUUID());
    const headlines = headlinesFrom(output);
    await logAiCall({
      brainId: board.id,
      job: "extract",
      model,
      inputIds,
      outputIds: cards.map((c) => c.id),
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    });
    if (!cards.length) return board;
    return { ...board, cards, headlineOptions: headlines.length ? headlines : board.headlineOptions };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("extract failed, keeping one card per answer:", message);
    await logAiCall({ brainId: board.id, job: "extract", model: EXTRACT_MODEL, inputIds, outputIds: [], error: message });
    return board;
  }
}

/** The walkthrough's last step: every card on the board becomes theirs. */
export async function approveBrain(user: CurrentUser): Promise<void> {
  const id = await brainFor(user);
  const supabase = await createClient();
  const cards = await supabase.from("cards").update({ approved_at: new Date().toISOString() }).eq("brain_id", id).is("approved_at", null);
  if (cards.error) throw new Error(cards.error.message);
  const { error } = await supabase.from("brains").update({ deep_dive_status: "approved" }).eq("id", id);
  if (error) throw new Error(error.message);
}
