import { test } from "node:test";
import assert from "node:assert/strict";
import { cardCounts, laneUsage, mappedShare, quietestRegion, regionHeat, thisWeek } from "./heat";
import { DEEP_DIVE_QUESTIONS, questionsInSitting } from "./questions";
import { blankBrain, cardColumns, sittingsDone, sourceAnswers, toBrain, toCard, type AnswerRow, type BrainRow, type CardRow } from "./savedBrain";
import { actualMix30d, daysSinceLastPost, longestRunWeeks, postsLastFourWeeks, regionsQuiet } from "./stats";

const now = new Date("2026-10-25T12:00:00");
const ids = (sitting: 1 | 2 | 3) => questionsInSitting(sitting).map((q) => q.id);
const answer = (key: string, typed: string | null, beat: string | null = null): AnswerRow => ({
  id: `00000000-0000-4000-8000-${key.replace("_", "").padStart(12, "0")}`,
  typed_text: typed,
  follow_up_answer: beat,
  clips: [],
  recorded_at: "2026-10-24T09:30:00+00:00",
  questions: { key },
});

test("a new brain stands on the database's defaults", () => {
  const brain = blankBrain("b1");
  assert.equal(brain.ownerName, "");
  assert.equal(brain.goal, "growing_audience");
  assert.equal(brain.enginePrimary, "storyteller");
  assert.deepEqual(brain.mix, { top: 50, middle: 40, bottom: 10 });
  assert.equal(brain.cadencePerWeek, 3);
  assert.equal(brain.headline, "");
  assert.equal(brain.deepDiveStatus, "not_started");
  assert.equal(brain.sittingsDone, 0);
  assert.equal(brain.observed, undefined);
});

test("a new brain doesn't trip up Home's numbers", () => {
  const brain = blankBrain("b1");
  const usage = laneUsage(brain, now);
  const heat = regionHeat(brain, usage);
  assert.equal(mappedShare(brain), 0);
  assert.ok(Object.values(heat).every(Number.isFinite));
  assert.ok(Object.values(cardCounts(brain)).every((n) => n === 0));
  assert.equal(quietestRegion(brain, heat), null);
  assert.equal(thisWeek(brain, usage, now), null);
  assert.equal(daysSinceLastPost(brain, now), null);
  assert.ok(Array.isArray(regionsQuiet(brain, now)));
  assert.equal(postsLastFourWeeks(brain, now).posted, 0);
  assert.equal(longestRunWeeks(brain, now), 0);
  assert.ok(Object.values(actualMix30d(brain, now)).every(Number.isFinite));
});

test("sittings count from the first, so Home offers the next one", () => {
  assert.equal(sittingsDone([]), 0);
  assert.equal(sittingsDone(ids(1).slice(1)), 0);
  assert.equal(sittingsDone(ids(1)), 1);
  assert.equal(sittingsDone([...ids(1), ...ids(2)]), 2);
  assert.equal(sittingsDone(ids(2)), 0);
  assert.equal(sittingsDone(DEEP_DIVE_QUESTIONS.map((q) => q.id)), 3);
});

test("answers become sources in the order they're asked, typed words and second beat together", () => {
  const sources = sourceAnswers([answer("s2_1", "Burnout is a design outcome."), answer("s1_2", "Bay four.", "I said nothing."), answer("s1_1", null)]);
  assert.deepEqual(
    sources.map((s) => [s.questionId, s.text, s.date]),
    [
      ["s1_2", "Bay four. I said nothing.", "2026-10-24"],
      ["s2_1", "Burnout is a design outcome.", "2026-10-24"],
    ]
  );
});

test("a built board reads its engine from the answers and counts every sitting done", () => {
  const row: BrainRow = { ...rowOf(blankBrain("b1")), deep_dive_status: "assembled" };
  const brain = toBrain(row, [], [answer("s1_2", "Three in the morning, bay four. Priya found me and sat down too.")]);
  assert.equal(brain.sittingsDone, 3);
  assert.ok(brain.observed);
});

test("cards keep their words, flags and approval date through the database", () => {
  const row: CardRow = {
    id: "c1",
    region_key: "stories",
    kind: "story",
    title: "Three in the morning",
    body: "Three in the morning, bay four.",
    source_answer_id: null,
    angles: ["the floor"],
    keywords: ["night shift"],
    is_lane: true,
    constructed: false,
    privacy: "off_board",
    funnel_default: "top",
    approved_at: "2026-10-25T00:00:00+00:00",
  };
  const card = toCard(row);
  assert.equal(card.approvedAt, "2026-10-25");
  assert.equal(card.sourceAnswerId, undefined);
  const { approved_at, ...rest } = cardColumns(card);
  assert.equal(approved_at, "2026-10-25");
  const { id: _id, source_answer_id: _source, approved_at: _approved, ...expected } = row;
  assert.deepEqual(rest, expected);
});

/** The row a brain would have come from, for building variations of it. */
function rowOf(brain: ReturnType<typeof blankBrain>): BrainRow {
  return {
    id: brain.id,
    owner_name: brain.ownerName,
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
    deep_dive_status: brain.deepDiveStatus,
  };
}
