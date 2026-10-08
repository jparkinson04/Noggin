/**
 * LinkedIn publishing. Mirrors the two tables in supabase/migrations/0002_linkedin_publishing.sql.
 * Nothing here ever holds a token: the browser-facing connection is the safe columns only.
 */

export type PostStatus = "scheduled" | "publishing" | "published" | "failed" | "cancelled";

export interface LinkedInConnection {
  id: string;
  userId: string;
  linkedinMemberUrn: string;
  displayName: string;
  avatarUrl: string | null;
  scopes: string[];
  /** ISO 8601, UTC. Tokens last 60 days and cannot be refreshed in the background. */
  tokenExpiresAt: string;
  connectedAt: string;
  updatedAt: string;
}

export interface PostMedia {
  kind: "image";
  url: string;
  alt?: string;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  studioPostId: string | null;
  body: string;
  media: PostMedia[];
  /** ISO 8601, UTC. */
  scheduledFor: string;
  /** IANA zone the person scheduled in, for display only. */
  timezone: string;
  status: PostStatus;
  linkedinPostUrn: string | null;
  linkedinPostUrl: string | null;
  errorCode: PublishErrorCode | null;
  errorMessage: string | null;
  attempts: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublishErrorCode =
  | "TOKEN_EXPIRED"
  | "RATE_LIMITED"
  | "INVALID_CONTENT"
  | "MEDIA_UPLOAD_FAILED"
  | "UNKNOWN";

export class PublishError extends Error {
  constructor(
    public readonly code: PublishErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PublishError";
  }
}

export interface PublishResult {
  /** e.g. urn:li:share:7123456789 */
  postUrn: string;
  /** Where to see it. */
  postUrl: string;
}

/** LinkedIn's limit for a post body. */
export const LINKEDIN_POST_LIMIT = 3000;
/** How long a self-serve access token lasts. */
export const TOKEN_LIFETIME_DAYS = 60;
