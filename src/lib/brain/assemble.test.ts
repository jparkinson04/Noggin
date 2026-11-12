import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble } from "./assemble";
import { blankBrain } from "./savedBrain";
import type { SourceAnswer } from "./schema";

const answers: SourceAnswer[] = [
  { id: "a1", questionId: "s1_2", date: "2026-10-24", text: "Three in the morning, bay four. Priya found me." },
  { id: "a2", questionId: "s2_2", date: "2026-10-24", text: "Everyone says post every day. That's wrong." },
  { id: "a3", questionId: "s3_3", date: "2026-10-24", text: "Jo said I gave her permission." },
];

test("one card per answer, in its question's region, pointing back to the answer", () => {
  const board = assemble(blankBrain("b1"), answers, (a) => `card-${a.id}`);
  assert.deepEqual(
    board.cards.map((c) => [c.id, c.regionKey, c.kind, c.funnelDefault, c.sourceAnswerId, c.title]),
    [
      ["card-a1", "stories", "story", "top", "a1", "Three in the morning, bay four"],
      ["card-a2", "opinions", "opinion", "middle", "a2", "Everyone says post every day. That's"],
      ["card-a3", "receipts", "receipt_win", "bottom", "a3", "Jo said I gave her permission"],
    ]
  );
  assert.ok(board.cards.every((c) => !c.constructed && c.privacy === "on_board" && c.body));
  assert.equal(board.deepDiveStatus, "assembled");
  assert.equal(board.sittingsDone, 3);
  assert.deepEqual(board.answers, answers);
});

test("an engine the person picked survives building the board", () => {
  const chosen = { ...blankBrain("b1"), enginePrimary: "teacher" as const, engineOverride: { primary: "teacher" as const, at: "2026-10-20" } };
  const board = assemble(chosen, answers, (a) => a.id);
  assert.ok(board.observed);
  assert.equal(board.enginePrimary, "teacher");
});
