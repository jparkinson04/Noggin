import type { Engine, EngineBlend, Goal, QuizResult } from "../brain/schema";
import { ENGINES } from "../brain/schema";
import { enginesFrom, mixFor, toPercentages } from "./mix";

/**
 * The content engine quiz, ported from expert-voice.co.uk/content-engine.
 *
 * PLACEHOLDER: the twelve questions, their options and the scoring below stand in for the
 * real ones until the founder's text is pasted in verbatim. The shape is final; the words are not.
 */

export interface QuizOption {
  text: string;
  /** Points toward each engine. */
  scores?: Partial<Record<Engine, number>>;
  /** The situation question sets this instead of scoring. */
  situation?: Goal;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "e1",
    text: "[PLACEHOLDER] When something goes well at work, what do you find yourself telling people?",
    options: [
      { text: "What happened, where, and who said what", scores: { storyteller: 3 } },
      { text: "How I did it, so they could do it too", scores: { teacher: 3 } },
      { text: "What it proves about how the industry gets this wrong", scores: { commentator: 3 } },
      { text: "Where I'm up to and what I'm trying next", scores: { documenter: 3 } },
    ],
  },
  {
    id: "e2",
    text: "[PLACEHOLDER] Someone asks for advice. Your first instinct?",
    options: [
      { text: "Tell them about the time it happened to me", scores: { storyteller: 3 } },
      { text: "Give them the three things to check", scores: { teacher: 3 } },
      { text: "Tell them what everyone else gets wrong about it", scores: { commentator: 3 } },
      { text: "Show them what I'm doing about it right now", scores: { documenter: 3 } },
    ],
  },
  {
    id: "e3",
    text: "[PLACEHOLDER] Which of these is your situation right now?",
    options: [
      { text: "Growing an audience", situation: "growing_audience" },
      { text: "Established and selling", situation: "established_selling" },
      { text: "Full with clients", situation: "full_with_clients" },
      { text: "Launching something", situation: "launching" },
    ],
  },
];

/** Index of the chosen option per question id. */
export type QuizAnswers = Record<string, number>;

/**
 * PLACEHOLDER flag rules: the real ones are ported from the quiz's scoring code.
 * Each returns the flag text when it fires.
 */
const FLAG_RULES: ((blend: EngineBlend, situation: Goal) => string | null)[] = [
  (blend) => {
    const values = ENGINES.map((e) => blend[e]);
    return Math.max(...values) - Math.min(...values) <= 12
      ? "Your four engines are close to even. That usually means you haven't picked a lane yet, not that you have four. Lead with the one that feels least like work."
      : null;
  },
  (blend, situation) =>
    situation === "established_selling" && blend.documenter >= 40
      ? "You're selling, but you mostly narrate work in progress. Buyers want proof of outcomes, not a diary. Let your credible posts carry the finished results."
      : null,
];

export function scoreQuiz(answers: QuizAnswers, now = new Date()): QuizResult {
  const weights = Object.fromEntries(ENGINES.map((e) => [e, 0])) as Record<Engine, number>;
  let situation: Goal = "growing_audience";
  for (const question of QUIZ) {
    const option = question.options[answers[question.id] ?? -1];
    if (!option) continue;
    if (option.situation) situation = option.situation;
    for (const engine of ENGINES) weights[engine] += option.scores?.[engine] ?? 0;
  }
  const blend = toPercentages(weights);
  const rule = mixFor(situation);
  return {
    blend,
    ...enginesFrom(blend),
    situation,
    mix: rule.mix,
    cadencePerWeek: rule.cadencePerWeek,
    quizFlag: FLAG_RULES.map((r) => r(blend, situation)).find((f) => f) ?? null,
    takenAt: now.toISOString().slice(0, 10),
  };
}

/** The shape a post takes, from the engine it leans on. */
export const SHAPE_FOR: Record<Engine, string> = {
  storyteller: "story",
  teacher: "lesson",
  documenter: "list",
  commentator: "question",
};

/** Picks a shape for a recommendation, weighted by the blend, stable for a given seed (e.g. the week number). */
export function shapeFor(blend: EngineBlend, seed: number): string {
  const roll = ((seed * 9301 + 49297) % 233280) / 233280;
  let acc = 0;
  for (const engine of ENGINES) {
    acc += blend[engine] / 100;
    if (roll < acc) return SHAPE_FOR[engine];
  }
  return SHAPE_FOR[ENGINES[0]];
}

/** [ENGINE COPY] placeholders. The founder supplies the text for all four. */
export const ENGINE_COPY: Record<Engine, string[]> = {
  storyteller: ["[ENGINE COPY: storyteller]"],
  teacher: ["[ENGINE COPY: teacher]"],
  commentator: ["[ENGINE COPY: commentator]"],
  documenter: ["[ENGINE COPY: documenter]"],
};
