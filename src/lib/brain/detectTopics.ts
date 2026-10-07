import type { Brain, Card, FunnelLevel } from "./schema";

/**
 * Phase 1 lane detection: keyword overlap.
 * Good enough to make the studio feel alive. Replace with embeddings in phase 3+ (see roadmap).
 */

const STOP = new Set([
  "the","a","an","and","or","but","to","of","in","on","at","for","with","is","it","i","my","we",
  "you","that","this","was","were","be","are","as","so","if","not","no","do","did","have","has",
]);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export interface Detection {
  card: Card;
  score: number;
  matched: string[];
}

export function detectLanes(brain: Brain, draft: string, limit = 3): Detection[] {
  const draftTokens = new Set(tokens(draft));
  if (!draftTokens.size) return [];

  const results: Detection[] = [];
  for (const card of brain.cards) {
    if (!card.isLane || card.privacy !== "on_board") continue;
    const vocab = new Set([
      ...card.keywords.map((k) => k.toLowerCase()),
      ...tokens(card.title),
    ]);
    const matched = [...vocab].filter((k) => draftTokens.has(k));
    if (matched.length) {
      results.push({ card, score: matched.length / Math.sqrt(vocab.size), matched });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Crude funnel read: offers and proof read as bottom, broad human story as top, insight as middle. */
export function detectFunnel(draft: string, detected: Detection[]): FunnelLevel {
  const t = draft.toLowerCase();
  const bottomSignals = ["dm me", "book a", "get in touch", "work with me", "results", "testimonial", "clients say", "%", "£"];
  if (bottomSignals.some((s) => t.includes(s))) return "bottom";
  if (detected.length) return detected[0].card.funnelDefault;
  return "middle";
}

/** Flags phrasing that isn't theirs. Extend from real transcripts over time. */
export const LINKEDIN_ISMS = [
  "in today's fast-paced world",
  "game-changer",
  "game changer",
  "let that sink in",
  "i'm humbled",
  "thrilled to announce",
  "unpopular opinion:",
  "here's the thing",
  "why? because",
];

export function voiceCheck(draft: string): string[] {
  const t = draft.toLowerCase();
  return LINKEDIN_ISMS.filter((p) => t.includes(p));
}
