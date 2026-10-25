import { observeEngine } from "../engine/observe";
import { QUESTIONS } from "./questions";
import type { Brain, Card, CardKind, FunnelLevel, RegionKey, SourceAnswer } from "./schema";

/** What a new card in a region is, before the person says otherwise. */
export function kindFor(region: RegionKey): CardKind {
  return region === "stories" ? "story" : region === "opinions" ? "opinion" : region === "receipts" ? "receipt_win" : region === "personality" ? "furniture" : "why_internal";
}

export function funnelFor(region: RegionKey): FunnelLevel {
  return region === "receipts" ? "bottom" : region === "opinions" ? "middle" : "top";
}

export const firstSixWords = (text: string) => text.trim().split(/\s+/).slice(0, 6).join(" ").replace(/[.,;:!?]$/, "");

/**
 * The deep dive becomes a board: one proposed card per answer, title = first six words, and the
 * engine read from how they answered unless they've already picked one. Replaces every card.
 * Runs in the browser on sample data and on the server for a saved brain, which passes UUIDs.
 */
export function assemble(brain: Brain, answers: SourceAnswer[], cardId: (answer: SourceAnswer) => string): Brain {
  const observed = observeEngine(answers);
  return {
    ...brain,
    answers,
    observed,
    enginePrimary: brain.engineOverride?.primary ?? observed?.primary ?? brain.enginePrimary,
    engineSecondary: brain.engineOverride ? brain.engineOverride.secondary : (observed?.secondary ?? brain.engineSecondary),
    deepDiveStatus: "assembled",
    sittingsDone: 3,
    cards: answers.map((a) => {
      const region: RegionKey = QUESTIONS.find((q) => q.id === a.questionId)?.region ?? "whys";
      return {
        id: cardId(a),
        regionKey: region,
        kind: kindFor(region),
        title: firstSixWords(a.text),
        body: a.text,
        angles: [],
        keywords: [],
        isLane: region !== "personality",
        constructed: false,
        privacy: "on_board",
        funnelDefault: funnelFor(region),
        sourceAnswerId: a.id,
      } satisfies Card;
    }),
  };
}
