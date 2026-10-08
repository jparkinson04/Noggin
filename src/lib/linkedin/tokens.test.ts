import { test } from "node:test";
import assert from "node:assert/strict";
import { daysUntilExpiry, isConnectionExpired, isExpiringSoon, tokenCoversDate } from "./tokens";
import type { LinkedInConnection } from "./types";

const now = new Date("2026-10-08T10:00:00Z");
const connection = (expires: string): LinkedInConnection => ({
  id: "c1",
  userId: "u1",
  linkedinMemberUrn: "urn:li:person:abc",
  displayName: "Maya Reid",
  avatarUrl: null,
  scopes: ["openid", "profile", "email", "w_member_social"],
  tokenExpiresAt: expires,
  connectedAt: "2026-08-09T10:00:00Z",
  updatedAt: "2026-08-09T10:00:00Z",
});

test("expired and days until expiry", () => {
  assert.equal(isConnectionExpired(connection("2026-10-08T09:59:00Z"), now), true);
  assert.equal(isConnectionExpired(connection("2026-10-08T10:01:00Z"), now), false);
  assert.equal(daysUntilExpiry(connection("2026-11-07T10:00:00Z"), now), 30);
  assert.equal(daysUntilExpiry(connection("2026-10-01T10:00:00Z"), now), -7);
});

test("token covers a scheduled date", () => {
  const c = connection("2026-10-20T00:00:00Z");
  assert.equal(tokenCoversDate(c, "2026-10-19T23:00:00Z"), true);
  assert.equal(tokenCoversDate(c, "2026-10-20T00:00:00Z"), false);
  assert.equal(tokenCoversDate(c, new Date("2026-11-01T00:00:00Z")), false);
});

test("expiring soon is seven days or fewer, not already expired", () => {
  assert.equal(isExpiringSoon(connection("2026-10-15T10:00:00Z"), now), true);
  assert.equal(isExpiringSoon(connection("2026-10-16T10:00:00Z"), now), false);
  assert.equal(isExpiringSoon(connection("2026-10-07T10:00:00Z"), now), false);
});
