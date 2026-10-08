/**
 * Drizzle schema. Mirrors docs/02-data-model.md. Phase 2.
 * Run `npm run db:generate` after changes; keep 0001_init.sql as the canonical first migration.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const regionKey = pgEnum("region_key", [
  "whys", "stories", "opinions", "personality", "receipts", "engine", "headline",
]);
export const engine = pgEnum("engine", ["storyteller", "teacher", "commentator", "documenter"]);
export const goal = pgEnum("goal", ["growing_audience", "established_selling", "full_with_clients", "launching"]);
export const funnelLevel = pgEnum("funnel_level", ["top", "middle", "bottom"]);
export const deepDiveStatus = pgEnum("deep_dive_status", ["not_started", "in_progress", "assembled", "approved"]);
export const medium = pgEnum("medium", ["voice", "text", "file", "photo"]);
export const postStatus = pgEnum("post_status", ["draft", "scheduled", "posted"]);
export const cardKind = pgEnum("card_kind", [
  "why_internal", "why_external", "why_philosophical", "story", "opinion", "opinion_reserve",
  "furniture", "signature", "receipt_number", "receipt_quote", "receipt_win",
]);
export const privacy = pgEnum("privacy", ["on_board", "off_board"]);
export const scheduledPostStatus = pgEnum("scheduled_post_status", [
  "scheduled", "publishing", "published", "failed", "cancelled",
]);

export const brains = pgTable("brains", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(), // auth.users.id
  ownerName: text("owner_name").notNull(),
  goal: goal("goal"),
  enginePrimary: engine("engine_primary"),
  engineSecondary: engine("engine_secondary"),
  mixTop: integer("mix_top").default(50),
  mixMiddle: integer("mix_middle").default(40),
  mixBottom: integer("mix_bottom").default(10),
  cadencePerWeek: integer("cadence_per_week").default(3),
  firstName: text("first_name"),
  lastName: text("last_name"),
  jobTitle: text("job_title"),
  company: text("company"),
  avatarUrl: text("avatar_url"),
  headline: text("headline"),
  headlineOptions: jsonb("headline_options").$type<string[]>().default([]),
  deepDiveStatus: deepDiveStatus("deep_dive_status").default("not_started").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").default(1).notNull(),
  part: integer("part").notNull(),
  position: integer("position").notNull(),
  text: text("text").notNull(),
  listeningFor: text("listening_for"),
  followUpHint: text("follow_up_hint"),
  safetyLine: text("safety_line"),
  region: regionKey("region").notNull(),
});

export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  medium: medium("medium").notNull(),
  audioUrl: text("audio_url"),
  transcript: text("transcript"),
  typedText: text("typed_text"),
  followUpQuestion: text("follow_up_question"),
  followUpAnswer: text("follow_up_answer"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  regionKey: regionKey("region_key").notNull(),
  kind: cardKind("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sourceAnswerId: uuid("source_answer_id").references(() => answers.id),
  angles: jsonb("angles").$type<string[]>().default([]).notNull(),
  keywords: jsonb("keywords").$type<string[]>().default([]).notNull(),
  isLane: boolean("is_lane").default(false).notNull(),
  constructed: boolean("constructed").default(false).notNull(),
  privacy: privacy("privacy").default("on_board").notNull(),
  funnelDefault: funnelLevel("funnel_default").default("middle").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  status: postStatus("status").default("draft").notNull(),
  body: text("body").notNull(),
  funnelLevel: funnelLevel("funnel_level"),
  laneCardIds: jsonb("lane_card_ids").$type<string[]>().default([]).notNull(),
  constructedLines: jsonb("constructed_lines").$type<{ start: number; end: number }[]>().default([]).notNull(),
  postedAt: date("posted_at"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const brainDumps = pgTable("brain_dumps", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  medium: medium("medium").notNull(),
  audioUrl: text("audio_url"),
  transcript: text("transcript"),
  text: text("text"),
  promotedToCardId: uuid("promoted_to_card_id").references(() => cards.id),
  promotedToPostId: uuid("promoted_to_post_id").references(() => posts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  storageUrl: text("storage_url").notNull(),
  caption: text("caption"),
  cardIds: jsonb("card_ids").$type<string[]>().default([]).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
});

export const feedItems = pgTable("feed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull(),
  kind: text("kind").notNull(), // tip | algorithm | trend | example
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  brainId: uuid("brain_id").references(() => brains.id, { onDelete: "cascade" }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  impressions: integer("impressions"),
  engagements: integer("engagements"),
  followers: integer("followers"),
  profileViews: integer("profile_views"),
  notes: text("notes"),
  source: text("source").default("manual").notNull(),
});

/** One LinkedIn account per user. See supabase/migrations/0002_linkedin_publishing.sql for the RLS and column grants. */
export const linkedinConnections = pgTable("linkedin_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(), // auth.users.id
  linkedinMemberUrn: text("linkedin_member_urn").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  scopes: text("scopes").array().notNull().default([]),
  /** Encrypted before it reaches the database; never selected by the browser. */
  accessTokenEncrypted: text("access_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduledPosts = pgTable(
  "scheduled_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    studioPostId: uuid("studio_post_id").references(() => posts.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    media: jsonb("media").$type<{ kind: "image"; url: string; alt?: string }[]>().default([]).notNull(),
    /** Stored in UTC. */
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    timezone: text("timezone").default("Europe/London").notNull(),
    status: scheduledPostStatus("status").default("scheduled").notNull(),
    linkedinPostUrn: text("linkedin_post_urn"),
    linkedinPostUrl: text("linkedin_post_url"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    attempts: integer("attempts").default(0).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("scheduled_posts_due").on(t.status, t.scheduledFor),
    check("scheduled_posts_body_length", sql`char_length(${t.body}) <= 3000`),
  ]
);

export const spelling = pgEnum("spelling", ["uk", "us"]);
export const emojiLevel = pgEnum("emoji_level", ["none", "sparingly", "happy"]);
export const hashtagLevel = pgEnum("hashtag_level", ["none", "up_to_3"]);
export const postLength = pgEnum("post_length", ["short", "medium", "long"]);
export const anonymiseOthers = pgEnum("anonymise_others", ["always", "ask"]);

/** One row per user, created by a trigger on sign-up. See supabase/migrations/0003_user_settings.sql. */
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(), // auth.users.id
  timezone: text("timezone").default("Europe/London").notNull(),
  spelling: spelling("spelling").default("uk").notNull(),
  bannedPhrases: text("banned_phrases").array().default([]).notNull(),
  noEmDashes: boolean("no_em_dashes").default(false).notNull(),
  signaturePhrases: text("signature_phrases").array().default([]).notNull(),
  emojiLevel: emojiLevel("emoji_level").default("none").notNull(),
  hashtagLevel: hashtagLevel("hashtag_level").default("none").notNull(),
  defaultPostLength: postLength("default_post_length").default("medium").notNull(),
  sharing: jsonb("sharing").$type<Record<string, "share" | "ask" | "never">>().notNull(),
  anonymiseOthers: anonymiseOthers("anonymise_others").default("ask").notNull(),
  postingSlots: jsonb("posting_slots").$type<{ day: number; time: string }[]>().default([]).notNull(),
  weeklyPostGoal: integer("weekly_post_goal").default(3).notNull(),
  confirmBeforePublish: boolean("confirm_before_publish").default(true).notNull(),
  notifications: jsonb("notifications").$type<Record<string, { email: boolean; inApp: boolean } | number>>().notNull(),
  keepVoiceRecordings: boolean("keep_voice_recordings").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
