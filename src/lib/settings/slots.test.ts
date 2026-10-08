import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPostingSlot } from "./slots";

// Thursday 8 October 2026, 10:00 local.
const now = new Date(2026, 9, 8, 10, 0);

test("no slots means no suggestion", () => {
  assert.equal(nextPostingSlot([], now), null);
});

test("later today wins over next week", () => {
  const at = nextPostingSlot([{ day: 4, time: "15:30" }, { day: 2, time: "09:00" }], now)!;
  assert.equal(at.getDay(), 4);
  assert.equal(at.getHours(), 15);
  assert.equal(at.getDate(), 8);
});

test("a slot earlier today rolls to its next occurrence", () => {
  const at = nextPostingSlot([{ day: 4, time: "08:00" }], now)!;
  assert.equal(at.getDate(), 15);
});

test("wraps into next week", () => {
  const at = nextPostingSlot([{ day: 2, time: "09:30" }], now)!;
  assert.equal(at.getDay(), 2);
  assert.equal(at.getDate(), 13);
  assert.equal(at.getMinutes(), 30);
});
