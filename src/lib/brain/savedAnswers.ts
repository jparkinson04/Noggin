import { z } from "zod";
import type { Question } from "./questions";

/**
 * A deep-dive response as it's saved: the answer and the second beat, each as typed text plus
 * voice notes already in Storage. Converts to and from the columns of an answers row.
 */
export interface SavedClip {
  /** In the voice-notes bucket: `<user id>/<question id>/<file>`. */
  path: string;
  seconds: number;
  /** What they said, once it's been transcribed. */
  transcript?: string;
}

export interface SavedAnswer {
  text: string;
  clips: SavedClip[];
}

export interface SavedResponse {
  answer: SavedAnswer;
  /** Null until they answer it or skip it. */
  secondBeat: SavedAnswer | "skipped" | null;
}

const Clip = z.object({
  path: z.string().min(1).max(300),
  seconds: z.number().min(0).max(4 * 60 * 60),
  transcript: z.string().max(100_000).optional(),
});
const Part = z.object({ text: z.string().max(50_000), clips: z.array(Clip).max(50) });
export const SavedResponseBody = z.object({
  answer: Part,
  secondBeat: z.union([Part, z.literal("skipped"), z.null()]),
});

/** The columns of an answers row that hold the response. */
export interface AnswerColumns {
  medium: "voice" | "text";
  typed_text: string | null;
  clips: SavedClip[];
  /** The answer's voice notes, transcribed and joined. Each clip also keeps its own. */
  transcript: string | null;
  follow_up_question: string | null;
  follow_up_answer: string | null;
  follow_up_clips: SavedClip[];
}

/** The transcripts of these voice notes, in order. */
export function spoken(clips: SavedClip[]): string {
  return clips
    .map((c) => c.transcript?.trim())
    .filter(Boolean)
    .join(" ");
}

export function hasContent(part: SavedAnswer): boolean {
  return part.text.trim().length > 0 || part.clips.length > 0;
}

/** Every voice note in the response, the answer's first. */
export function allClips(response: SavedResponse): SavedClip[] {
  const beat = response.secondBeat;
  return [...response.answer.clips, ...(beat && beat !== "skipped" ? beat.clips : [])];
}

export function toColumns(question: Question, response: SavedResponse): AnswerColumns {
  const beat = response.secondBeat;
  const given = beat && beat !== "skipped" ? beat : null;
  return {
    medium: response.answer.clips.length ? "voice" : "text",
    typed_text: response.answer.text || null,
    clips: response.answer.clips,
    transcript: spoken(response.answer.clips) || null,
    // The prompt is stored once it's been answered or skipped. Stored with nothing said means skipped.
    follow_up_question: beat ? (question.secondBeat ?? null) : null,
    follow_up_answer: given?.text || null,
    follow_up_clips: given?.clips ?? [],
  };
}

export function fromColumns(row: AnswerColumns): SavedResponse {
  const beat = { text: row.follow_up_answer ?? "", clips: row.follow_up_clips };
  return {
    answer: { text: row.typed_text ?? "", clips: row.clips },
    secondBeat: hasContent(beat) ? beat : row.follow_up_question ? "skipped" : null,
  };
}
