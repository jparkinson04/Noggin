import type { Brain, Card, Engine, EngineBlend, FunnelLevel, Goal, LaneUsage, Mix } from "../brain/schema";
import { ENGINES, REGION_LABELS } from "../brain/schema";
import { SHAPE_FOR } from "../engine/quiz";

/**
 * The week's pattern: which days to post, and what each slot should serve and be shaped like,
 * dealt from the mix and the blend so the week as a whole matches both.
 *
 * The brief that defined the output was cut off after "a pattern"; this is the smaller version.
 */

/** 0 = Sunday. */
export function defaultPostingDays(cadencePerWeek: number): number[] {
  if (cadencePerWeek >= 5) return [1, 2, 3, 4, 5];
  if (cadencePerWeek === 4) return [1, 2, 3, 4];
  if (cadencePerWeek === 3) return [2, 3, 4];
  if (cadencePerWeek === 2) return [2, 4];
  return [2];
}

export interface WeekSlot {
  /** 0 = Sunday. */
  day: number;
  outcome: FunnelLevel;
  engine: Engine;
  shape: string;
}

export interface WeekPlan {
  situation: Goal;
  slots: WeekSlot[];
  /** Over a four-week cycle, how many posts each outcome gets. */
  perMonth: Record<FunnelLevel, number>;
}

/** Deals `count` items from weighted shares so the largest shares come first and rounding is fair. */
function deal<K extends string>(shares: Record<K, number>, count: number): K[] {
  const keys = Object.keys(shares) as K[];
  const total = keys.reduce((s, k) => s + shares[k], 0) || 1;
  const owed = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const out: K[] = [];
  for (let i = 0; i < count; i++) {
    for (const k of keys) owed[k] += shares[k] / total;
    const next = keys.reduce((a, b) => (owed[b] > owed[a] ? b : a));
    owed[next] -= 1;
    out.push(next);
  }
  return out;
}

export function planWeek(input: {
  situation: Goal;
  cadencePerWeek: number;
  postingDays?: number[];
  mix: Mix;
  blend: EngineBlend;
}): WeekPlan {
  const days = input.postingDays ?? defaultPostingDays(input.cadencePerWeek);
  const outcomes = deal<FunnelLevel>(input.mix, days.length);
  const engines = deal<Engine>(input.blend, days.length);
  const monthly = deal<FunnelLevel>(input.mix, days.length * 4);
  return {
    situation: input.situation,
    slots: days.map((day, i) => ({ day, outcome: outcomes[i], engine: engines[i], shape: SHAPE_FOR[engines[i]] })),
    perMonth: {
      top: monthly.filter((o) => o === "top").length,
      middle: monthly.filter((o) => o === "middle").length,
      bottom: monthly.filter((o) => o === "bottom").length,
    },
  };
}

export const ENGINE_ORDER: Engine[] = ["storyteller", "commentator", "teacher", "documenter"];
export { ENGINES };

/** A slot with the card it suggests and why. */
export interface SuggestedSlot extends WeekSlot {
  card?: Card;
  reason?: string;
}

const WEEKS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/**
 * Suggests a card per slot: the quietest lane whose outcome matches, never-posted first,
 * and never the same card twice in a week.
 */
export function suggestForWeek(plan: WeekPlan, brain: Brain, usage: LaneUsage[], now = new Date()): SuggestedSlot[] {
  const taken = new Set<string>();
  const byCard = new Map(usage.map((u) => [u.cardId, u]));
  const lanes = brain.cards.filter((c) => c.isLane && c.privacy === "on_board" && byCard.has(c.id));
  const quietness = (u: LaneUsage) => (u.lastPostedAt ? new Date(u.lastPostedAt).getTime() : -Infinity);

  return plan.slots.map((slot) => {
    const pick = lanes
      .filter((c) => c.funnelDefault === slot.outcome && !taken.has(c.id))
      .sort((a, b) => quietness(byCard.get(a.id)!) - quietness(byCard.get(b.id)!))[0];
    if (!pick) return slot;
    taken.add(pick.id);
    const u = byCard.get(pick.id)!;
    const region = REGION_LABELS[pick.regionKey].toLowerCase();
    const reason = u.lastPostedAt
      ? `Last posted ${WEEKS[Math.floor((now.getTime() - new Date(u.lastPostedAt).getTime()) / (7 * 86_400_000))] ?? "many"} weeks ago.`
      : `Never posted. Your ${region} could use it.`;
    return { ...slot, card: pick, reason };
  });
}
