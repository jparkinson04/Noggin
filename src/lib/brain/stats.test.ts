import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleBrain } from "./sampleBrain";
import { actualMix30d, capturesThisMonth, daysSinceLastPost, longestRunWeeks, postsLastFourWeeks, regionsQuiet } from "./stats";

// The sample brain's dates are written against this day: Tuesday 6 October 2026.
const now = new Date("2026-10-06T12:00:00");
const empty = { ...sampleBrain, posts: [] };

test("days since last post", () => {
  assert.equal(daysSinceLastPost(sampleBrain, now), 4);
  assert.equal(daysSinceLastPost(empty, now), null);
});

test("regions gone quiet", () => {
  assert.deepEqual(regionsQuiet(sampleBrain, now), ["whys"]);
  assert.deepEqual(regionsQuiet(empty, now), ["whys", "stories", "opinions", "personality", "receipts"]);
});

test("captures this month", () => {
  const captures = [{ at: "2026-10-02T09:00:00" }, { at: "2026-10-05T18:00:00" }, { at: "2026-09-28T09:00:00" }];
  assert.deepEqual(capturesThisMonth(captures, now), { count: 2, lastWeekday: "Monday" });
  assert.deepEqual(capturesThisMonth([], now), { count: 0, lastWeekday: null });
});

test("posts in the last four weeks against target", () => {
  const r = postsLastFourWeeks(sampleBrain, now);
  assert.equal(r.target, 12);
  assert.equal(r.posted, 9);
  assert.equal(r.weeks.length, 4);
  assert.deepEqual(r.weeks.map((w) => w.posted), [2, 2, 3, 2]);
  assert.equal(postsLastFourWeeks(empty, now).posted, 0);
});

test("longest run of weeks that met the cadence", () => {
  assert.equal(longestRunWeeks(sampleBrain, now), 1);
  assert.equal(longestRunWeeks(empty, now), 0);
});

test("actual mix over 30 days", () => {
  const m = actualMix30d(sampleBrain, now);
  assert.equal(m.top + m.middle + m.bottom, 100);
  assert.deepEqual(m, { top: 56, middle: 33, bottom: 11 });
  assert.deepEqual(actualMix30d(empty, now), { top: 0, middle: 0, bottom: 0 });
});
