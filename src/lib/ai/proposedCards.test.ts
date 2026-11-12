import { test } from "node:test";
import assert from "node:assert/strict";
import type { SourceAnswer } from "../brain/schema";
import { headlinesFrom, isTheirWords, toProposedCards, type ExtractedCard } from "./proposedCards";

const story: SourceAnswer = {
  id: "a1",
  questionId: "s1_2",
  date: "2026-10-24",
  text: "Um, three in the morning, bay four. I I sat down on the floor of the sluice room and couldn't get up. Priya found me.",
};
const card = (patch: Partial<ExtractedCard>): ExtractedCard => ({
  answerId: "a1",
  region: "stories",
  kind: "story",
  title: "Three in the morning",
  body: "Three in the morning, bay four.",
  angles: ["what Priya didn't say"],
  keywords: ["Night shift", "night shift", "burnout"],
  outcome: "visible",
  involvesOthers: false,
  ...patch,
});
let n = 0;
const ids = () => `card-${++n}`;

test("their words, give or take ums, stutters and punctuation", () => {
  assert.equal(isTheirWords("I sat down on the floor of the sluice room", story.text), true);
  assert.equal(isTheirWords("Three in the morning. Bay four!", story.text), true);
  assert.equal(isTheirWords("I collapsed in the sluice room", story.text), false);
  assert.equal(isTheirWords("the floor of the sluice", story.text), true);
  assert.equal(isTheirWords("loor of the slu", story.text), false);
  assert.equal(isTheirWords("", story.text), false);
});

test("a body that isn't their words is constructed, whatever the model says", () => {
  const [kept, reworded] = toProposedCards(
    { cards: [card({}), card({ body: "She found me collapsed at 3am." })], headlines: [] },
    [story],
    ids
  );
  assert.equal(kept.constructed, false);
  assert.equal(reworded.constructed, true);
  assert.equal(kept.sourceAnswerId, "a1");
  assert.equal(kept.approvedAt, undefined);
});

test("anything involving other people starts off the board", () => {
  const [card1] = toProposedCards({ cards: [card({ involvesOthers: true })], headlines: [] }, [story], ids);
  assert.equal(card1.privacy, "off_board");
});

test("cards that point nowhere, or are empty, are dropped; a wrong kind is put right", () => {
  const cards = toProposedCards(
    {
      cards: [card({ answerId: "nope" }), card({ body: "  " }), card({ region: "receipts", kind: "story", outcome: "credible" })],
      headlines: [],
    },
    [story],
    ids
  );
  assert.equal(cards.length, 1);
  assert.equal(cards[0].kind, "receipt_win");
  assert.equal(cards[0].funnelDefault, "bottom");
  assert.deepEqual(cards[0].angles, []);
});

test("keywords are tidied and angles kept only for stories and opinions", () => {
  const [card1] = toProposedCards({ cards: [card({})], headlines: [] }, [story], ids);
  assert.deepEqual(card1.keywords, ["night shift", "burnout"]);
  assert.deepEqual(card1.angles, ["what Priya didn't say"]);
  assert.equal(card1.isLane, true);
});

test("no more than four cards from one answer", () => {
  const cards = toProposedCards({ cards: Array.from({ length: 6 }, () => card({})), headlines: [] }, [story], ids);
  assert.equal(cards.length, 4);
});

test("up to three distinct headlines", () => {
  assert.deepEqual(headlinesFrom({ cards: [], headlines: ["One", " One ", "Two", "", "Three", "Four"] }), ["One", "Two", "Three"]);
});
