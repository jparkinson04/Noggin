import type { Brain, FunnelLevel, Mix, Post, RegionKey } from "./schema";
import { quietAfterDays } from "./heat";

/** The handful of figures Home shows. Nothing here needs the LinkedIn export. */

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const MAP_REGIONS: RegionKey[] = ["whys", "stories", "opinions", "personality", "receipts"];

const posted = (brain: Brain): (Post & { postedAt: string })[] =>
  brain.posts.filter((p): p is Post & { postedAt: string } => p.status === "posted" && !!p.postedAt);

const at = (iso: string) => new Date(iso).getTime();

/** Whole days since the most recent post, or null if they've never posted. */
export function daysSinceLastPost(brain: Brain, now = new Date()): number | null {
  const last = posted(brain).map((p) => at(p.postedAt)).sort((a, b) => b - a)[0];
  return last === undefined ? null : Math.floor((now.getTime() - last) / DAY);
}

/** Regions whose lanes have all gone past the quiet threshold (or were never posted from). */
export function regionsQuiet(brain: Brain, now = new Date()): RegionKey[] {
  const limit = quietAfterDays(brain.cadencePerWeek) * DAY;
  const recent = posted(brain).filter((p) => now.getTime() - at(p.postedAt) < limit);
  return MAP_REGIONS.filter((region) => {
    const lanes = brain.cards.filter((c) => c.regionKey === region && c.isLane && c.privacy === "on_board");
    if (!lanes.length) return false;
    return !recent.some((p) => p.laneCardIds.some((id) => lanes.some((l) => l.id === id)));
  });
}

/** Captures ("Tell me something") in the current calendar month, and the weekday of the latest. */
export function capturesThisMonth(captures: { at: string }[], now = new Date()): { count: number; lastWeekday: string | null } {
  const month = now.getMonth();
  const year = now.getFullYear();
  const inMonth = captures.filter((c) => {
    const d = new Date(c.at);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const last = [...captures].sort((a, b) => at(b.at) - at(a.at))[0];
  return {
    count: inMonth.length,
    lastWeekday: last ? new Date(last.at).toLocaleDateString("en-GB", { weekday: "long" }) : null,
  };
}

/** The last four weeks ending today: posts made against the cadence target, oldest week first. */
export function postsLastFourWeeks(brain: Brain, now = new Date()): { posted: number; target: number; weeks: { posted: number; target: number }[] } {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const end = midnight.getTime() + DAY; // through the end of today
  const weeks = [3, 2, 1, 0].map((back) => {
    const to = end - back * WEEK;
    const from = to - WEEK;
    return { posted: posted(brain).filter((p) => at(p.postedAt) >= from && at(p.postedAt) < to).length, target: brain.cadencePerWeek };
  });
  return { posted: weeks.reduce((s, w) => s + w.posted, 0), target: brain.cadencePerWeek * 4, weeks };
}

/** Longest run of consecutive calendar weeks that met the cadence, anywhere in their history. */
export function longestRunWeeks(brain: Brain, now = new Date()): number {
  const times = posted(brain).map((p) => at(p.postedAt));
  if (!times.length) return 0;
  const weekOf = (t: number) => Math.floor((t - startOfWeek(now)) / WEEK);
  const counts = new Map<number, number>();
  for (const t of times) counts.set(weekOf(t), (counts.get(weekOf(t)) ?? 0) + 1);
  const hit = [...counts.entries()].filter(([, n]) => n >= brain.cadencePerWeek).map(([w]) => w).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < hit.length; i++) {
    run = i > 0 && hit[i] === hit[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Monday 00:00 of the week containing `now`, local time. */
function startOfWeek(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** What the last 30 days of posts actually served, as percentages. All zero if nothing was posted. */
export function actualMix30d(brain: Brain, now = new Date()): Mix {
  const recent = posted(brain).filter((p) => now.getTime() - at(p.postedAt) <= 30 * DAY);
  const count = (level: FunnelLevel) => recent.filter((p) => p.funnelLevel === level).length;
  const total = recent.length;
  if (!total) return { top: 0, middle: 0, bottom: 0 };
  const top = Math.round((count("top") / total) * 100);
  const middle = Math.round((count("middle") / total) * 100);
  return { top, middle, bottom: 100 - top - middle };
}
