import type { Brain, Card, FunnelLevel, LaneUsage, LaneStatus, RegionKey } from "./schema";
import { OUTCOME_LABELS, REGION_LABELS } from "./schema";

const DAY = 86_400_000;

/**
 * How long a lane can go without a post before it's "quiet".
 * Scales with cadence: someone posting once a week has fewer slots to spread around.
 */
export function quietAfterDays(cadencePerWeek: number): number {
  if (cadencePerWeek >= 4) return 21;
  if (cadencePerWeek >= 3) return 28;
  if (cadencePerWeek >= 2) return 42;
  return 56;
}

export function laneUsage(brain: Brain, now = new Date()): LaneUsage[] {
  const lanes = brain.cards.filter((c) => c.isLane && c.privacy === "on_board");
  const posted = brain.posts.filter((p) => p.status === "posted" && p.postedAt);
  const recent = posted.filter(
    (p) => now.getTime() - new Date(p.postedAt!).getTime() <= 90 * DAY
  );
  const quietDays = quietAfterDays(brain.cadencePerWeek);
  const fairShare = lanes.length ? 1 / lanes.length : 0;

  return lanes.map((card) => {
    const mine = recent.filter((p) => p.laneCardIds.includes(card.id));
    const last = mine
      .map((p) => new Date(p.postedAt!).getTime())
      .sort((a, b) => b - a)[0];
    const daysSince = last ? (now.getTime() - last) / DAY : Infinity;
    const share = recent.length ? mine.length / recent.length : 0;

    // Heat decays linearly from 1 (today) to 0 (quietDays ago or more).
    const heat = Number.isFinite(daysSince)
      ? Math.max(0, 1 - daysSince / quietDays)
      : 0;

    let status: LaneStatus;
    if (!last) status = "unused";
    else if (share > fairShare * 2.5 && mine.length >= 3) status = "overworked";
    else if (daysSince >= quietDays) status = "quiet";
    else if (heat < 0.4) status = "fading";
    else status = "fresh";

    return {
      cardId: card.id,
      lastPostedAt: last ? new Date(last).toISOString() : undefined,
      postCount90d: mine.length,
      shareOfPosts: share,
      heat,
      status,
    };
  });
}

/** Average heat per region, used to tint the lobes. Regions with no lanes default to 0.6 (neutral). */
export function regionHeat(brain: Brain, usage: LaneUsage[]): Record<RegionKey, number> {
  const byCard = new Map(usage.map((u) => [u.cardId, u.heat]));
  const out = {} as Record<RegionKey, number>;
  const keys: RegionKey[] = [
    "whys",
    "stories",
    "opinions",
    "personality",
    "receipts",
    "engine",
    "headline",
  ];
  for (const key of keys) {
    const lanes = brain.cards.filter((c) => c.regionKey === key && c.isLane);
    if (!lanes.length) {
      out[key] = 0.6;
      continue;
    }
    const total = lanes.reduce((sum, c) => sum + (byCard.get(c.id) ?? 0), 0);
    out[key] = total / lanes.length;
  }
  return out;
}

/** The region that most needs attention: lowest heat among regions that have lanes. */
export function quietestRegion(brain: Brain, heat: Record<RegionKey, number>): RegionKey | null {
  let best: RegionKey | null = null;
  let low = Infinity;
  for (const key of Object.keys(heat) as RegionKey[]) {
    const hasLanes = brain.cards.some((c) => c.regionKey === key && c.isLane);
    if (hasLanes && heat[key] < low) {
      low = heat[key];
      best = key;
    }
  }
  return best;
}

export function daysSinceLabel(iso?: string, now = new Date()): string {
  if (!iso) return "never posted";
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export function cardById(brain: Brain, id: string): Card | undefined {
  return brain.cards.find((c) => c.id === id);
}

/** Share of regions with at least one approved card. "62% mapped" on Home and the Brain stage. */
export function mappedShare(brain: Brain): number {
  const keys: RegionKey[] = ["whys", "stories", "opinions", "personality", "receipts", "engine", "headline"];
  const mapped = keys.filter((key) =>
    brain.cards.some((c) => c.regionKey === key && c.approvedAt)
  ).length;
  return mapped / keys.length;
}

/** The one thing worth writing this week: the lane that has been quiet longest, never-posted first. */
export interface Recommendation {
  card: Card;
  usage: LaneUsage;
  outcome: FunnelLevel;
  /** Two sentences: the outcome, then why now. */
  why: string;
}

const SMALL_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const inWords = (n: number) => SMALL_NUMBERS[n] ?? String(n);

export function thisWeek(brain: Brain, usage: LaneUsage[], now = new Date()): Recommendation | null {
  const byStatus = (s: LaneStatus) => usage.filter((u) => u.status === s);
  const pick =
    byStatus("unused")[0] ??
    byStatus("quiet").sort((a, b) => (a.lastPostedAt ?? "").localeCompare(b.lastPostedAt ?? ""))[0];
  if (!pick) return null;
  const card = cardById(brain, pick.cardId);
  if (!card) return null;

  const region = REGION_LABELS[card.regionKey].toLowerCase();
  const regionLast = usage
    .filter((u) => cardById(brain, u.cardId)?.regionKey === card.regionKey && u.lastPostedAt)
    .map((u) => u.lastPostedAt!)
    .sort()
    .at(-1);
  const regionWeeks = regionLast
    ? Math.floor((now.getTime() - new Date(regionLast).getTime()) / (7 * DAY))
    : null;
  const regionPart =
    regionWeeks === null
      ? `You've never posted from your ${region}`
      : `Your ${region} have been quiet for ${inWords(regionWeeks)} weeks`;
  const lanePart = pick.lastPostedAt
    ? `this one hasn't been used for ${daysSinceLabel(pick.lastPostedAt, now).replace(/ ago$/, "")}`
    : "this one has never been posted";
  const outcome = card.funnelDefault;
  const label = OUTCOME_LABELS[outcome];
  return {
    card,
    usage: pick,
    outcome,
    why: `${label[0].toUpperCase()}${label.slice(1)}. ${regionPart} and ${lanePart}.`,
  };
}

/** Which weekdays someone on this cadence posts. See src/lib/plan/week.ts. */
export { defaultPostingDays as postingDays } from "../plan/week";
