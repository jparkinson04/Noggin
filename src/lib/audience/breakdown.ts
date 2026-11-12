import { AUDIENCE_GROUPS, type AudienceGroup, type AudiencePerson } from "./types";

export interface GroupShare {
  group: AudienceGroup;
  count: number;
  /** Whole percent. The four always add up to 100 when there is anyone at all. */
  percent: number;
}

const key = (p: AudiencePerson) => `${p.name.trim().toLowerCase()}|${p.headline.trim().toLowerCase()}`;

/**
 * The same person often reacts to several posts and so appears in several screenshots. Count them
 * once, and drop rows with no name.
 */
export function uniquePeople(people: AudiencePerson[]): AudiencePerson[] {
  const seen = new Map<string, AudiencePerson>();
  for (const p of people) {
    const name = p.name.trim();
    if (!name) continue;
    const k = key(p);
    if (!seen.has(k)) seen.set(k, { ...p, name, headline: p.headline.trim(), why: p.why.trim() });
  }
  return [...seen.values()];
}

/** How the people split across the four groups. Largest-remainder rounding, so it adds to 100. */
export function breakdown(people: AudiencePerson[]): GroupShare[] {
  const total = people.length;
  const counts = AUDIENCE_GROUPS.map((group) => ({ group, count: people.filter((p) => p.group === group).length }));
  if (total === 0) return counts.map((c) => ({ ...c, percent: 0 }));
  const exact = counts.map((c) => (c.count / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact.map((v, i) => ({ i, frac: v - floors[i] })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return counts.map((c, i) => ({ ...c, percent: floors[i] }));
}

export function shareOf(people: AudiencePerson[], group: AudienceGroup): GroupShare {
  return breakdown(people).find((s) => s.group === group)!;
}
