/**
 * Light or dark, chosen in Settings. Kept in a cookie rather than with the other settings so the
 * server can paint the right one on the very first frame, signed in or not, with no flash.
 */
export type Theme = "dark" | "light";

export const THEME_COOKIE = "theme";

/** Dark unless they've chosen light. */
export function themeFrom(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
