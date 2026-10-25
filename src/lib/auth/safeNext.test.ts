import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safeNext";

test("keeps paths on this site", () => {
  assert.equal(safeNext("/deep-dive?q=s1_2"), "/deep-dive?q=s1_2");
  assert.equal(safeNext("/"), "/");
});

test("sends anything else home", () => {
  assert.equal(safeNext(null), "/");
  assert.equal(safeNext(""), "/");
  assert.equal(safeNext("https://example.com"), "/");
  assert.equal(safeNext("//example.com"), "/");
  assert.equal(safeNext("/\\example.com"), "/");
  assert.equal(safeNext("deep-dive"), "/");
});
