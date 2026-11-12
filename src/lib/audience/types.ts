/** Who the person wants to reach, and who is actually reacting. See docs/05-roadmap.md, phase 3. */

/** How someone who reacted sits against the ideal client. */
export type AudienceGroup = "ideal" | "adjacent" | "peer" | "other";

export const AUDIENCE_GROUPS: AudienceGroup[] = ["ideal", "adjacent", "peer", "other"];

export const GROUP_LABELS: Record<AudienceGroup, string> = {
  ideal: "The people you want",
  adjacent: "Close to them",
  peer: "People who do what you do",
  other: "Everyone else",
};

export const GROUP_BLURBS: Record<AudienceGroup, string> = {
  ideal: "They match who you said you want to reach.",
  adjacent: "Not the buyer, but near one: they could introduce you or pass a post on.",
  peer: "Same line of work as you. Good company, rarely a client.",
  other: "Recruiters, sellers, old colleagues and anyone a headline can't place.",
};

export interface AudiencePerson {
  name: string;
  headline: string;
  group: AudienceGroup;
  /** One short reason for the group, from their headline. */
  why: string;
}

export interface AudienceTip {
  title: string;
  body: string;
}

/** The two lines every audit is read against. Their words, never rewritten. */
export interface AudienceTarget {
  idealClient: string;
  goal: string;
}

export interface AudienceAudit {
  id: string;
  createdAt: string;
  target: AudienceTarget;
  people: AudiencePerson[];
  summary: string;
  tips: AudienceTip[];
  screenshots: number;
}

export const MAX_SCREENSHOTS = 12;
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ScreenshotType = (typeof SCREENSHOT_TYPES)[number];
export const MAX_PASTED_CHARS = 20000;
export const MAX_TARGET_CHARS = 400;
