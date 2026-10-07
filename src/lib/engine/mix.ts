import type { EngineBlend, Engine, Goal, Mix } from "../brain/schema";
import { ENGINES } from "../brain/schema";

/**
 * Situation → mix and cadence. In code the mix is top/middle/bottom; on screen it is only ever
 * visible / trustworthy / credible (OUTCOME_LABELS). Reasons are the one line shown beside each row.
 */
export const SITUATION_LABELS: Record<Goal, string> = {
  growing_audience: "Growing an audience",
  established_selling: "Established and selling",
  full_with_clients: "Full with clients",
  launching: "Launching something",
};

interface MixRule {
  mix: Mix;
  cadencePerWeek: number;
  reasons: { top: string; middle: string; bottom: string };
}

export const MIX_RULES: Record<Goal, MixRule> = {
  growing_audience: {
    mix: { top: 50, middle: 40, bottom: 10 },
    cadencePerWeek: 3,
    reasons: {
      top: "Half your posts should reach people who don't know you yet. That's the whole job right now.",
      middle: "Enough to show how you think, so the new people have a reason to stay.",
      bottom: "A little proof. Nobody is weighing you up yet, so don't sell to an empty room.",
    },
  },
  established_selling: {
    mix: { top: 30, middle: 40, bottom: 30 },
    cadencePerWeek: 3,
    reasons: {
      top: "Keep the top of the room fresh so the audience doesn't go stale.",
      middle: "The people deciding between you and someone else need to see how you think.",
      bottom: "You have proof, and buyers are watching. Show it.",
    },
  },
  full_with_clients: {
    mix: { top: 45, middle: 45, bottom: 10 },
    cadencePerWeek: 2,
    reasons: {
      top: "Stay known while you're busy, so the pipeline is there when you're not.",
      middle: "Opinions and lessons keep your name attached to your thinking, not just your availability.",
      bottom: "Almost no selling. You can't take the work on anyway.",
    },
  },
  launching: {
    mix: { top: 35, middle: 30, bottom: 35 },
    cadencePerWeek: 4,
    reasons: {
      top: "New people need to find you before the launch, not after.",
      middle: "Why this, why now: the thinking behind the thing you're launching.",
      bottom: "Proof and the offer, more than usual, for a short while.",
    },
  },
};

export function mixFor(situation: Goal): MixRule {
  return MIX_RULES[situation];
}

/** Primary is the largest share; secondary only if it is at least 60% of the primary. */
export function enginesFrom(blend: EngineBlend): { primary: Engine; secondary?: Engine } {
  const sorted = [...ENGINES].sort((a, b) => blend[b] - blend[a]);
  const [primary, second] = sorted;
  return blend[second] >= blend[primary] * 0.6 ? { primary, secondary: second } : { primary };
}

/** "Roughly one post in N" for the second engine. */
export function oneInEvery(blend: EngineBlend, secondary: Engine): number {
  return Math.max(2, Math.round(100 / blend[secondary]));
}

/** Rounds a set of weights to whole percentages that sum to exactly 100. */
export function toPercentages(weights: Record<Engine, number>): EngineBlend {
  const total = ENGINES.reduce((s, e) => s + weights[e], 0) || 1;
  const raw = ENGINES.map((e) => (weights[e] / total) * 100);
  const floored = raw.map(Math.floor);
  let remainder = 100 - floored.reduce((s, n) => s + n, 0);
  const order = raw.map((v, i) => [v - floored[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (remainder <= 0) break;
    floored[i]++;
    remainder--;
  }
  return Object.fromEntries(ENGINES.map((e, i) => [e, floored[i]])) as EngineBlend;
}
