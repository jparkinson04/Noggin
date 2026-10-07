/**
 * Deep-dive answers, held in memory for now. Phase 2 swaps the voice blob for an upload
 * and the placeholder transcript for a real one.
 */

export interface VoiceClip {
  /** Object URL for the recorded blob, for playback. */
  url: string;
  seconds: number;
}

export interface Answer {
  /** Every voice note recorded for this prompt, in order. */
  clips: VoiceClip[];
  /** What they typed. Empty for a voice-only answer until transcription exists. */
  text: string;
}

export const EMPTY_ANSWER: Answer = { clips: [], text: "" };

/** Everything the person has done on one question's screen. */
export interface QuestionResponse {
  answer?: Answer;
  secondBeat?: Answer | "skipped";
  /** The thin-answer nudge shows once per question, then never again. */
  nudge: "not_shown" | "showing" | "done";
}

export const NO_RESPONSE: QuestionResponse = { nudge: "not_shown" };

const THIN_VOICE_SECONDS = 40;
const THIN_TYPED_WORDS = 60;

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function voiceSeconds(answer: Answer): number {
  return answer.clips.reduce((sum, c) => sum + c.seconds, 0);
}

/** Voice under 40 seconds or typed under 60 words. Either one being long enough is enough. */
export function isThin(answer: Answer): boolean {
  const voiceOk = voiceSeconds(answer) >= THIN_VOICE_SECONDS;
  const typedOk = wordCount(answer.text) >= THIN_TYPED_WORDS;
  return !voiceOk && !typedOk;
}

export function durationLabel(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* "We'd keep this": pure rules, no AI. A sentence earns its place by being specific. */

const NUMBER_WORDS =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|half|dozen|first|second|third)\b/i;

// Double quotes anywhere; single quotes only when they open after a space, so "didn't" doesn't count.
const QUOTED_SPEECH = /["“][^"”]{2,}["”]|(^|\s)['‘][^'’]{2,}.*?['’](?=[\s.,!?;:]|$)/;

const CAPITALISED = /^[A-Z][a-z]+/;
const OPENING_QUOTE = /^["“'‘(]/;

const SENTENCE_BREAK = /(?<=[.!?]["”'’]?)\s+(?=["“'‘]?[A-Z0-9])/;

/** Splits on sentence ends, but never inside double quotes: what someone said stays in one piece. */
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let carried = "";
  for (const piece of text.replace(/\s+/g, " ").trim().split(SENTENCE_BREAK)) {
    carried = carried ? `${carried} ${piece}` : piece;
    const open = (carried.match(/“/g) ?? []).length - (carried.match(/”/g) ?? []).length;
    const straight = (carried.match(/"/g) ?? []).length;
    if (open > 0 || straight % 2 === 1) continue;
    sentences.push(carried);
    carried = "";
  }
  if (carried) sentences.push(carried);
  return sentences.filter(Boolean);
}

// Words that are only capitalised because they open a sentence or a quote.
const OPENERS = new Set(
  "a an and after all as at because before but every everyone for from by did do each he hello her here his how if in is it its just most my no nobody not nothing now on one our people she so some that since the then there these they things this those to was we well what when where while who why with yes you your".split(
    " "
  )
);

/** Capitalised names and places. A word that opens a sentence or a quote only counts if it isn't an ordinary opener. */
export function capitalisedNames(sentence: string): string[] {
  const names: string[] = [];
  sentence.split(/\s+/).forEach((raw, i) => {
    const word = raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").replace(/['’](s|d|ll|ve|re|m)$/, "");
    if (!CAPITALISED.test(word) || word === "I") return;
    const opens = i === 0 || OPENING_QUOTE.test(raw);
    if (opens && (OPENERS.has(word.toLowerCase()) || NUMBER_WORDS.test(word))) return;
    names.push(word);
  });
  return names;
}

function specificity(sentence: string): number {
  let score = 0;
  if (capitalisedNames(sentence).length) score++;
  if (/\d/.test(sentence) || NUMBER_WORDS.test(sentence)) score++;
  if (QUOTED_SPEECH.test(sentence)) score++;
  return score;
}

/** Up to three sentences containing a name, a place, a number, or quoted speech. In their order. */
export function keepLines(text: string, limit = 3): string[] {
  const scored = splitSentences(text)
    .map((sentence, index) => ({ sentence, index, score: specificity(sentence) }))
    .filter((s) => s.score > 0);
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);
}
