import type { LinkedInConnection } from "./types";

const DAY = 86_400_000;

export function isConnectionExpired(connection: LinkedInConnection, now = new Date()): boolean {
  return new Date(connection.tokenExpiresAt).getTime() <= now.getTime();
}

/** Whole days until the token expires. Zero or negative once it has. */
export function daysUntilExpiry(connection: LinkedInConnection, now = new Date()): number {
  return Math.floor((new Date(connection.tokenExpiresAt).getTime() - now.getTime()) / DAY);
}

/** Will the token still be valid when a post is due? Used to warn at scheduling time. */
export function tokenCoversDate(connection: LinkedInConnection, date: Date | string): boolean {
  return new Date(connection.tokenExpiresAt).getTime() > new Date(date).getTime();
}

/** Seven days or fewer: show the warning. */
export const EXPIRY_WARNING_DAYS = 7;

export function isExpiringSoon(connection: LinkedInConnection, now = new Date()): boolean {
  const days = daysUntilExpiry(connection, now);
  return days >= 0 && days <= EXPIRY_WARNING_DAYS;
}
