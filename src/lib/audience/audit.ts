import type { CurrentUser } from "@/lib/auth/currentUser";
import { readAudience, type Screenshot } from "@/lib/ai/audience";
import { logAiCall } from "@/lib/ai/log";
import { loadBrain } from "@/lib/brain/store";
import { REGION_LABELS, type Brain } from "@/lib/brain/schema";
import { supabaseConfigured } from "@/lib/supabase/config";
import { uniquePeople } from "./breakdown";
import { loadTarget, saveAudit } from "./store";
import type { AudienceAudit } from "./types";

/** The titles of the cards on their board, by region: what a tip is allowed to point at. */
export function cardTitlesByRegion(brain: Brain): Record<string, string[]> {
  const titles: Record<string, string[]> = {};
  for (const card of brain.cards) {
    if (card.privacy !== "on_board" || card.constructed) continue;
    (titles[REGION_LABELS[card.regionKey]] ??= []).push(card.title);
  }
  return titles;
}

export class NoTargetError extends Error {}
export class NothingReadError extends Error {}

/**
 * Runs one audit: reads the screenshots and pasted lists against who they want to reach, saves the
 * result and returns it. The screenshots are read and dropped; they are never stored.
 */
export async function runAudit(user: CurrentUser, screenshots: Screenshot[], pasted: string): Promise<{ audit: AudienceAudit; unreadable: number }> {
  const target = await loadTarget(user);
  if (!target.idealClient.trim()) throw new NoTargetError("Say who you want to reach first.");
  const brain = await loadBrain(user);

  const { output, model, usage } = await readAudience({
    target,
    headline: brain.headline,
    cardTitles: cardTitlesByRegion(brain),
    screenshots,
    pasted,
  });
  const people = uniquePeople(output.people);
  if (people.length === 0) throw new NothingReadError("Couldn't find anyone in those. Try the reactions list on a post.");

  const { audit, brainId } = await saveAudit(user, {
    target,
    people,
    summary: output.summary.trim(),
    tips: output.tips.slice(0, 3).map((tip) => ({ title: tip.title.trim(), body: tip.body.trim() })),
    screenshots: screenshots.length,
    model,
  });
  // ai_calls lives in Supabase; without it there is nowhere to log to.
  if (supabaseConfigured) {
    await logAiCall({
      brainId,
      job: "audience_audit",
      model,
      inputIds: [],
      outputIds: [audit.id],
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    });
  }
  return { audit, unreadable: Math.max(0, Math.round(output.unreadable)) };
}
