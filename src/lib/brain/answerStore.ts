import type { CurrentUser } from "@/lib/auth/currentUser";
import { VOICE_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Answer, QuestionResponse } from "./answers";
import type { Question } from "./questions";
import { allClips, fromColumns, toColumns, type AnswerColumns, type SavedAnswer, type SavedResponse } from "./savedAnswers";

/**
 * Deep-dive answers in Supabase, read and written as the signed-in person, so row level security
 * keeps everyone to their own brain. Server only.
 */

/** How long a voice note's playback link lasts once the deep dive has loaded. */
const LINK_SECONDS = 6 * 60 * 60;

type Row = AnswerColumns & { questions: { key: string } | null };

/** Question ids by key. Rows keep their ids when `npm run db:questions` updates them. */
const questionIds = new Map<string, string>();

async function findBrain(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("brains").select("id").eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { id: string } | null)?.id ?? null;
}

/** Made on the first save. The name stays empty until the profile has one. */
async function brainFor(user: CurrentUser): Promise<string> {
  const existing = await findBrain(user.id);
  if (existing) return existing;
  const supabase = await createClient();
  const { error } = await supabase
    .from("brains")
    .upsert({ owner_id: user.id, owner_name: "" }, { onConflict: "owner_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  const made = await findBrain(user.id);
  if (!made) throw new Error("Couldn't make a brain.");
  return made;
}

async function questionId(key: string): Promise<string> {
  const known = questionIds.get(key);
  if (known) return known;
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("id").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Question ${key} isn't in the database. Run npm run db:questions.`);
  const id = (data as { id: string }).id;
  questionIds.set(key, id);
  return id;
}

/** Everything they've said so far, keyed by question id, ready for the deep-dive screen. */
export async function loadResponses(userId: string): Promise<Record<string, QuestionResponse>> {
  const brainId = await findBrain(userId);
  if (!brainId) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("medium, typed_text, clips, follow_up_question, follow_up_answer, follow_up_clips, questions(key)")
    .eq("brain_id", brainId);
  if (error) throw new Error(error.message);
  const saved = ((data ?? []) as unknown as Row[]).flatMap((row) =>
    row.questions ? [{ key: row.questions.key, response: fromColumns(row) }] : []
  );

  // The bucket is private, so playback goes through links that expire.
  const links = new Map<string, string>();
  const paths = saved.flatMap(({ response }) => allClips(response).map((c) => c.path));
  if (paths.length) {
    const { data: signed, error: signError } = await supabase.storage.from(VOICE_BUCKET).createSignedUrls(paths, LINK_SECONDS);
    if (signError) throw new Error(signError.message);
    for (const s of signed ?? []) if (s.path && s.signedUrl) links.set(s.path, s.signedUrl);
  }
  const playable = (part: SavedAnswer): Answer => ({
    text: part.text,
    clips: part.clips.map((c) => ({ url: links.get(c.path) ?? "", seconds: c.seconds, path: c.path })),
  });

  return Object.fromEntries(
    saved.map(({ key, response }) => [
      key,
      {
        answer: playable(response.answer),
        secondBeat: response.secondBeat === "skipped" ? "skipped" : response.secondBeat ? playable(response.secondBeat) : undefined,
        // The thin-answer nudge had its moment when they first answered.
        nudge: "done",
      } satisfies QuestionResponse,
    ])
  );
}

/** Saves one question's response over the last save, and marks the deep dive as started. */
export async function saveResponse(user: CurrentUser, question: Question, response: SavedResponse): Promise<void> {
  const brainId = await brainFor(user);
  const supabase = await createClient();
  const { error } = await supabase.from("answers").upsert(
    {
      brain_id: brainId,
      question_id: await questionId(question.id),
      ...toColumns(question, response),
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "brain_id,question_id" }
  );
  if (error) throw new Error(error.message);
  const { error: statusError } = await supabase
    .from("brains")
    .update({ deep_dive_status: "in_progress" })
    .eq("id", brainId)
    .eq("deep_dive_status", "not_started");
  if (statusError) throw new Error(statusError.message);
}
