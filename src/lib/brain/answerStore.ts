import type { CurrentUser } from "@/lib/auth/currentUser";
import { transcribe, transcriptionConfigured } from "@/lib/ai/transcribe";
import { VOICE_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Answer, QuestionResponse } from "./answers";
import { brainFor, findBrainId } from "./brainId";
import type { Question } from "./questions";
import {
  allClips,
  fromColumns,
  spoken,
  toColumns,
  type AnswerColumns,
  type SavedAnswer,
  type SavedClip,
  type SavedResponse,
} from "./savedAnswers";

/**
 * Deep-dive answers in Supabase, read and written as the signed-in person, so row level security
 * keeps everyone to their own brain. Voice notes are transcribed as they're saved. Server only.
 */

/** How long a voice note's playback link lasts once the deep dive has loaded. */
const LINK_SECONDS = 6 * 60 * 60;

type Row = AnswerColumns & { questions: { key: string } | null };

/** Question ids by key. Rows keep their ids when `npm run db:questions` updates them. */
const questionIds = new Map<string, string>();

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

/** One stored voice note, transcribed. */
async function transcribeStored(path: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(VOICE_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "The recording isn't there.");
  return transcribe(data, path.split("/").pop() ?? "voice-note.webm");
}

/**
 * Transcripts for the voice notes in `paths` that don't have one, keyed by path. A note that can't
 * be transcribed just stays without: it never stops a save.
 */
async function transcribeMissing(paths: string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (!transcriptionConfigured()) return found;
  await Promise.all(
    paths.map(async (path) => {
      try {
        found.set(path, await transcribeStored(path));
      } catch (e) {
        console.error("transcription failed", path, e instanceof Error ? e.message : e);
      }
    })
  );
  return found;
}

const withTranscripts = (clips: SavedClip[], known: Map<string, string>): SavedClip[] =>
  clips.map((c) => (c.transcript || !known.has(c.path) ? c : { ...c, transcript: known.get(c.path) }));

/** Everything they've said so far, keyed by question id, ready for the deep-dive screen. */
export async function loadResponses(userId: string): Promise<Record<string, QuestionResponse>> {
  const brainId = await findBrainId(userId);
  if (!brainId) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("medium, typed_text, clips, transcript, follow_up_question, follow_up_answer, follow_up_clips, questions(key)")
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
    clips: part.clips.map((c) => ({ url: links.get(c.path) ?? "", seconds: c.seconds, path: c.path, transcript: c.transcript })),
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

/**
 * Saves one question's response over the last save, and marks the deep dive as started. New voice
 * notes are transcribed on the way; returns every transcript the response now has, by path.
 */
export async function saveResponse(
  user: CurrentUser,
  question: Question,
  response: SavedResponse
): Promise<Record<string, string>> {
  const brainId = await brainFor(user);
  const qid = await questionId(question.id);
  const supabase = await createClient();

  // Transcripts we already have: sent back by the browser, or on the last save of this answer.
  const known = new Map<string, string>();
  for (const c of allClips(response)) if (c.transcript) known.set(c.path, c.transcript);
  if (allClips(response).some((c) => !known.has(c.path))) {
    const { data } = await supabase.from("answers").select("clips, follow_up_clips").eq("brain_id", brainId).eq("question_id", qid).maybeSingle();
    const before = data as Pick<AnswerColumns, "clips" | "follow_up_clips"> | null;
    for (const c of [...(before?.clips ?? []), ...(before?.follow_up_clips ?? [])]) if (c.transcript) known.set(c.path, c.transcript);
  }
  const fresh = await transcribeMissing(allClips(response).flatMap((c) => (known.has(c.path) ? [] : [c.path])));
  for (const [path, text] of fresh) known.set(path, text);

  const beat = response.secondBeat;
  const transcribed: SavedResponse = {
    answer: { ...response.answer, clips: withTranscripts(response.answer.clips, known) },
    secondBeat: beat && beat !== "skipped" ? { ...beat, clips: withTranscripts(beat.clips, known) } : beat,
  };

  const { error } = await supabase.from("answers").upsert(
    { brain_id: brainId, question_id: qid, ...toColumns(question, transcribed), recorded_at: new Date().toISOString() },
    { onConflict: "brain_id,question_id" }
  );
  if (error) throw new Error(error.message);
  const { error: statusError } = await supabase
    .from("brains")
    .update({ deep_dive_status: "in_progress" })
    .eq("id", brainId)
    .eq("deep_dive_status", "not_started");
  if (statusError) throw new Error(statusError.message);
  return Object.fromEntries(known);
}

/** Fills in any voice note saved before its transcript came back, so the board is built from every word. */
export async function backfillTranscripts(brainId: string): Promise<void> {
  if (!transcriptionConfigured()) return;
  const supabase = await createClient();
  const { data, error } = await supabase.from("answers").select("id, clips, follow_up_clips").eq("brain_id", brainId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { id: string; clips: SavedClip[]; follow_up_clips: SavedClip[] }[];
  await Promise.all(
    rows.map(async (row) => {
      const missing = [...row.clips, ...row.follow_up_clips].filter((c) => !c.transcript).map((c) => c.path);
      if (!missing.length) return;
      const found = await transcribeMissing(missing);
      if (!found.size) return;
      const clips = withTranscripts(row.clips, found);
      const { error: updateError } = await supabase
        .from("answers")
        .update({ clips, follow_up_clips: withTranscripts(row.follow_up_clips, found), transcript: spoken(clips) || null })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
    })
  );
}
