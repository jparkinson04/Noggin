import { observeEngine } from "../engine/observe";
import { QUESTIONS, SITTINGS, questionsInSitting } from "./questions";
import type { Brain, Card, CardKind, Engine, Goal, Mix, QuizResult, RegionKey, SourceAnswer } from "./schema";

/**
 * A brain as it's saved: the brains row, its cards, and its deep-dive answers, converted into the
 * Brain the app runs on. Posts, events and brain dumps aren't saved yet, so a saved brain starts
 * with none. No zod here: the browser imports this, and the API routes check what it sends.
 */

export interface BrainRow {
  id: string;
  owner_name: string;
  first_name: string | null;
  last_name: string | null;
  goal: Goal | null;
  engine_primary: Engine | null;
  engine_secondary: Engine | null;
  engine_override: Brain["engineOverride"] | null;
  quiz: QuizResult | null;
  mix_top: number | null;
  mix_middle: number | null;
  mix_bottom: number | null;
  cadence_per_week: number | null;
  headline: string | null;
  headline_options: string[] | null;
  deep_dive_status: Brain["deepDiveStatus"];
}

export const BRAIN_COLUMNS =
  "id, owner_name, first_name, last_name, goal, engine_primary, engine_secondary, engine_override, quiz, mix_top, mix_middle, mix_bottom, cadence_per_week, headline, headline_options, deep_dive_status";

export interface CardRow {
  id: string;
  region_key: RegionKey;
  kind: CardKind;
  title: string;
  body: string;
  source_answer_id: string | null;
  angles: string[];
  keywords: string[];
  is_lane: boolean;
  constructed: boolean;
  privacy: Card["privacy"];
  funnel_default: Card["funnelDefault"];
  approved_at: string | null;
}

export const CARD_COLUMNS =
  "id, region_key, kind, title, body, source_answer_id, angles, keywords, is_lane, constructed, privacy, funnel_default, approved_at";

/** An answers row, as far as the brain needs it: what was said, and to which question. */
export interface AnswerRow {
  id: string;
  typed_text: string | null;
  follow_up_answer: string | null;
  clips: unknown[];
  recorded_at: string;
  questions: { key: string } | null;
}

export const ANSWER_COLUMNS = "id, typed_text, follow_up_answer, clips, recorded_at, questions(key)";

// Until the person takes the quiz or picks one, the Board needs something to stand on. These match
// the database's defaults for mix and cadence.
const DEFAULT_GOAL: Goal = "growing_audience";
const DEFAULT_ENGINE: Engine = "storyteller";

/** Sittings finished, counted from the first: Home offers the next one. */
export function sittingsDone(answeredQuestionIds: Iterable<string>): number {
  const answered = new Set(answeredQuestionIds);
  let done = 0;
  for (const sitting of SITTINGS) {
    if (!questionsInSitting(sitting.number).every((q) => answered.has(q.id))) break;
    done++;
  }
  return done;
}

/**
 * Each answer with words in it, in the order the questions are asked, as a source cards can point
 * back to. Voice-only answers wait for transcripts.
 */
export function sourceAnswers(rows: AnswerRow[]): SourceAnswer[] {
  const order = (questionId: string) => QUESTIONS.findIndex((q) => q.id === questionId);
  return rows
    .flatMap((row) => {
      const text = [row.typed_text, row.follow_up_answer].filter(Boolean).join(" ");
      return row.questions && text ? [{ id: row.id, questionId: row.questions.key, text, date: row.recorded_at.slice(0, 10) }] : [];
    })
    .sort((a, b) => order(a.questionId) - order(b.questionId));
}

export function toCard(row: CardRow): Card {
  return {
    id: row.id,
    regionKey: row.region_key,
    kind: row.kind,
    title: row.title,
    body: row.body,
    angles: row.angles,
    keywords: row.keywords,
    isLane: row.is_lane,
    constructed: row.constructed,
    privacy: row.privacy,
    funnelDefault: row.funnel_default,
    approvedAt: row.approved_at?.slice(0, 10),
    sourceAnswerId: row.source_answer_id ?? undefined,
  };
}

/** A card's columns, less its id, brain and source: the server sets those. */
export function cardColumns(card: Card) {
  return {
    region_key: card.regionKey,
    kind: card.kind,
    title: card.title,
    body: card.body,
    angles: card.angles,
    keywords: card.keywords,
    is_lane: card.isLane,
    constructed: card.constructed,
    privacy: card.privacy,
    funnel_default: card.funnelDefault,
    approved_at: card.approvedAt ?? null,
  };
}

export function toBrain(row: BrainRow, cards: CardRow[], answers: AnswerRow[]): Brain {
  const sources = sourceAnswers(answers);
  const status = row.deep_dive_status;
  const assembled = status === "assembled" || status === "approved";
  return {
    id: row.id,
    ownerName: row.owner_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
    goal: row.goal ?? DEFAULT_GOAL,
    enginePrimary: row.engine_primary ?? DEFAULT_ENGINE,
    engineSecondary: row.engine_secondary ?? undefined,
    engineOverride: row.engine_override ?? undefined,
    quiz: row.quiz ?? undefined,
    // What the answers showed is only read once the board is built from them, as in the deep dive.
    observed: assembled ? observeEngine(sources) : undefined,
    mix: { top: row.mix_top ?? 50, middle: row.mix_middle ?? 40, bottom: row.mix_bottom ?? 10 },
    cadencePerWeek: row.cadence_per_week ?? 3,
    headline: row.headline ?? "",
    headlineOptions: row.headline_options ?? [],
    deepDiveStatus: status,
    sittingsDone: assembled ? 3 : sittingsDone(answers.flatMap((a) => (a.questions ? [a.questions.key] : []))),
    events: [],
    answers: sources,
    cards: cards.map(toCard),
    posts: [],
  };
}

/** A brain with nothing in it yet: what a new person starts from. */
export function blankBrain(id: string): Brain {
  return toBrain(
    {
      id,
      owner_name: "",
      first_name: null,
      last_name: null,
      goal: null,
      engine_primary: null,
      engine_secondary: null,
      engine_override: null,
      quiz: null,
      mix_top: null,
      mix_middle: null,
      mix_bottom: null,
      cadence_per_week: null,
      headline: null,
      headline_options: null,
      deep_dive_status: "not_started",
    },
    [],
    []
  );
}

/** Everything about the brain the Board edits, apart from the cards. Sent whole each time. */
export interface BrainFields {
  goal: Goal;
  mix: Mix;
  cadencePerWeek: number;
  enginePrimary: Engine;
  engineSecondary: Engine | null;
  engineOverride: { primary: Engine; secondary?: Engine; at: string } | null;
  quiz: QuizResult | null;
  headline: string;
  headlineOptions: string[];
}

export function brainFields(brain: Brain): BrainFields {
  return {
    goal: brain.goal,
    mix: brain.mix,
    cadencePerWeek: brain.cadencePerWeek,
    enginePrimary: brain.enginePrimary,
    engineSecondary: brain.engineSecondary ?? null,
    engineOverride: brain.engineOverride ?? null,
    quiz: brain.quiz ?? null,
    headline: brain.headline,
    headlineOptions: brain.headlineOptions,
  };
}

export function brainColumns(fields: BrainFields) {
  return {
    goal: fields.goal,
    mix_top: fields.mix.top,
    mix_middle: fields.mix.middle,
    mix_bottom: fields.mix.bottom,
    cadence_per_week: fields.cadencePerWeek,
    engine_primary: fields.enginePrimary,
    engine_secondary: fields.engineSecondary,
    engine_override: fields.engineOverride,
    quiz: fields.quiz,
    headline: fields.headline,
    headline_options: fields.headlineOptions,
  };
}

export const CARD_KINDS = [
  "why_internal", "why_external", "why_philosophical", "story", "opinion", "opinion_reserve",
  "furniture", "signature", "receipt_number", "receipt_quote", "receipt_win",
] as const satisfies readonly CardKind[];
