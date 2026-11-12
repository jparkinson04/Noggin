import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "./questions";
import { allClips, fromColumns, hasContent, toColumns, type SavedResponse } from "./savedAnswers";

const withBeat = QUESTIONS.find((q) => q.id === "s1_2")!; // "And what did you actually say?"
const noBeat = QUESTIONS.find((q) => q.id === "s1_5")!;
const clip = (n: number) => ({ path: `user/s1_2/${n}.webm`, seconds: 30 + n });

const roundTrip = (response: SavedResponse, question = withBeat) => fromColumns(toColumns(question, response));

test("typed answers come back as they went in", () => {
  const response: SavedResponse = { answer: { text: "The car park at Tesco.", clips: [] }, secondBeat: null };
  assert.deepEqual(roundTrip(response), response);
  assert.equal(toColumns(withBeat, response).medium, "text");
});

test("voice notes keep their order, answer and second beat apart", () => {
  const response: SavedResponse = {
    answer: { text: "", clips: [clip(1), clip(2)] },
    secondBeat: { text: "I said yes before she finished.", clips: [clip(3)] },
  };
  const columns = toColumns(withBeat, response);
  assert.equal(columns.medium, "voice");
  assert.equal(columns.typed_text, null);
  assert.equal(columns.follow_up_question, withBeat.secondBeat);
  assert.deepEqual(roundTrip(response), response);
  assert.deepEqual(allClips(response).map((c) => c.path), ["user/s1_2/1.webm", "user/s1_2/2.webm", "user/s1_2/3.webm"]);
});

test("a skipped second beat stays skipped, and an unanswered one stays open", () => {
  const skipped: SavedResponse = { answer: { text: "Yes.", clips: [] }, secondBeat: "skipped" };
  assert.deepEqual(roundTrip(skipped), skipped);
  const open: SavedResponse = { answer: { text: "Yes.", clips: [] }, secondBeat: null };
  assert.equal(toColumns(withBeat, open).follow_up_question, null);
  assert.deepEqual(roundTrip(open), open);
});

test("questions with no second beat store no prompt", () => {
  const response: SavedResponse = { answer: { text: "The week the funding fell through.", clips: [] }, secondBeat: null };
  assert.equal(toColumns(noBeat, response).follow_up_question, null);
});

test("an answer needs words or a voice note", () => {
  assert.equal(hasContent({ text: "  ", clips: [] }), false);
  assert.equal(hasContent({ text: "", clips: [clip(1)] }), true);
});
