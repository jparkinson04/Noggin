import { test } from "node:test";
import assert from "node:assert/strict";
import { breakdown, shareOf, uniquePeople } from "./breakdown";
import type { AudienceGroup, AudiencePerson } from "./types";

const person = (name: string, group: AudienceGroup, headline = "Nurse"): AudiencePerson => ({ name, headline, group, why: "" });

test("someone who reacted to three posts is counted once", () => {
  const people = uniquePeople([person("Jo Marsh", "ideal"), person(" jo marsh ", "ideal"), person("Jo Marsh", "ideal", "Nurse ")]);
  assert.equal(people.length, 1);
  assert.equal(people[0].name, "Jo Marsh");
});

test("two people with the same name and different headlines stay two people", () => {
  assert.equal(uniquePeople([person("Sam Lee", "ideal", "ICU nurse"), person("Sam Lee", "peer", "Career coach")]).length, 2);
});

test("rows with no name are dropped", () => {
  assert.equal(uniquePeople([person("  ", "other")]).length, 0);
});

test("the four shares always add up to 100", () => {
  const people = [person("a", "ideal"), person("b", "adjacent"), person("c", "peer")];
  const shares = breakdown(people);
  assert.equal(shares.reduce((sum, s) => sum + s.percent, 0), 100);
  assert.deepEqual(shares.map((s) => s.count), [1, 1, 1, 0]);
});

test("nobody at all is four zeros, not a division by zero", () => {
  assert.deepEqual(breakdown([]).map((s) => s.percent), [0, 0, 0, 0]);
});

test("shareOf reads one group", () => {
  const people = [person("a", "ideal"), person("b", "peer"), person("c", "peer"), person("d", "peer")];
  assert.deepEqual(shareOf(people, "ideal"), { group: "ideal", count: 1, percent: 25 });
});
