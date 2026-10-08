import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeForLinkedIn, firstLine } from "./format";

test("escapes every reserved character", () => {
  assert.equal(escapeForLinkedIn("\\|{}@[]()<>#*_~"), "\\\\\\|\\{\\}\\@\\[\\]\\(\\)\\<\\>\\#\\*\\_\\~");
});

test("leaves ordinary text, punctuation and newlines alone", () => {
  const text = "Three in the morning, bay four.\nI sat down and couldn't get up. 100% true!";
  assert.equal(escapeForLinkedIn(text), text);
});

test("escapes inside a sentence", () => {
  assert.equal(escapeForLinkedIn("Burnout isn't weakness (it's design) #nursing"), "Burnout isn't weakness \\(it's design\\) \\#nursing");
});

test("is safe to apply to already-backslashed text only once", () => {
  assert.equal(escapeForLinkedIn("a\\b"), "a\\\\b");
});

test("first line", () => {
  assert.equal(firstLine("\n\nBay four, again.\nSecond line."), "Bay four, again.");
  assert.equal(firstLine("x".repeat(100), 20), "x".repeat(19) + "…");
  assert.equal(firstLine(""), "");
});
