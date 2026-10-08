/** Settings. Mirrors user_settings in supabase/migrations/0003_user_settings.sql. */

export type Spelling = "uk" | "us";
export type EmojiLevel = "none" | "sparingly" | "happy";
export type HashtagLevel = "none" | "up_to_3";
export type PostLength = "short" | "medium" | "long";
export type SharingChoice = "share" | "ask" | "never";
export type AnonymiseOthers = "always" | "ask";

export interface PostingSlot {
  /** 0 = Sunday. */
  day: number;
  /** "09:30", in the person's timezone. */
  time: string;
}

export type NotificationKey = "topUp" | "digest" | "postPublished" | "postFailed" | "connectionExpiring" | "nudge";

export interface NotificationPrefs {
  topUp: Channels;
  digest: Channels;
  postPublished: Channels;
  postFailed: Channels;
  connectionExpiring: Channels;
  nudge: Channels;
  nudgeAfterDays: 7 | 14 | 30;
}
export interface Channels {
  email: boolean;
  inApp: boolean;
}

export interface UserSettings {
  userId: string;
  timezone: string;
  spelling: Spelling;
  bannedPhrases: string[];
  noEmDashes: boolean;
  signaturePhrases: string[];
  emojiLevel: EmojiLevel;
  hashtagLevel: HashtagLevel;
  defaultPostLength: PostLength;
  /** Topic key → choice. The seven built-in keys plus any custom ones. */
  sharing: Record<string, SharingChoice>;
  anonymiseOthers: AnonymiseOthers;
  postingSlots: PostingSlot[];
  weeklyPostGoal: number;
  confirmBeforePublish: boolean;
  notifications: NotificationPrefs;
  keepVoiceRecordings: boolean;
  updatedAt: string;
}

/** Profile fields live on the brain (brains table), not in settings. */
export interface Profile {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  avatarUrl: string | null;
  email: string;
  /** "google" etc. when they signed in with a provider; null for email + password. */
  oauthProvider: string | null;
}

export const SHARING_TOPICS: { key: string; label: string }[] = [
  { key: "family", label: "Family and relationships" },
  { key: "health", label: "Health" },
  { key: "money", label: "Money and finances" },
  { key: "failures", label: "Failures and low points" },
  { key: "client_names", label: "Client names" },
  { key: "employer", label: "Current employer" },
  { key: "politics", label: "Politics and beliefs" },
];

export const SUGGESTED_BANNED = [
  "game-changer",
  "delighted to announce",
  "humbled",
  "let that sink in",
  "in today's fast-paced world",
  "thrilled to announce",
  "unpopular opinion",
  "here's the thing",
];

export const DEFAULT_SETTINGS: Omit<UserSettings, "userId" | "updatedAt"> = {
  timezone: "Europe/London",
  spelling: "uk",
  bannedPhrases: [],
  noEmDashes: false,
  signaturePhrases: [],
  emojiLevel: "none",
  hashtagLevel: "none",
  defaultPostLength: "medium",
  sharing: { family: "ask", health: "ask", money: "ask", failures: "share", client_names: "never", employer: "ask", politics: "never" },
  anonymiseOthers: "ask",
  postingSlots: [],
  weeklyPostGoal: 3,
  confirmBeforePublish: true,
  notifications: {
    topUp: { email: true, inApp: true },
    digest: { email: false, inApp: false },
    postPublished: { email: false, inApp: true },
    postFailed: { email: true, inApp: true },
    connectionExpiring: { email: true, inApp: true },
    nudge: { email: true, inApp: true },
    nudgeAfterDays: 14,
  },
  keepVoiceRecordings: true,
};

/** Character ceilings for the default length. LinkedIn's hard limit is 3,000. */
export const POST_LENGTH_CHARS: Record<PostLength, number> = { short: 600, medium: 1500, long: 3000 };
