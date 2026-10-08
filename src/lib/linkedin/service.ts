import { getPublisher, isMockMode } from "./publisher";
import { escapeForLinkedIn } from "./format";
import { getStore, type LinkedInStore } from "./store";
import { isConnectionExpired } from "./tokens";
import { LINKEDIN_POST_LIMIT, PublishError, TOKEN_LIFETIME_DAYS, type LinkedInConnection, type ScheduledPost } from "./types";

/**
 * The rules. Every route and the worker call these; nothing else touches the store or the publisher.
 * Every function takes the acting user's id and refuses anything that isn't theirs.
 */

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "RequestError";
  }
}

function validateBody(body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new RequestError(400, "The post is empty.");
  if (trimmed.length > LINKEDIN_POST_LIMIT) throw new RequestError(400, `LinkedIn posts are ${LINKEDIN_POST_LIMIT} characters at most.`);
  return trimmed;
}

function validateFuture(when: string, now = new Date()) {
  const t = new Date(when);
  if (Number.isNaN(t.getTime())) throw new RequestError(400, "That isn't a date.");
  if (t.getTime() <= now.getTime()) throw new RequestError(400, "Pick a time in the future.");
  return t.toISOString();
}

async function requireConnection(store: LinkedInStore, userId: string): Promise<LinkedInConnection> {
  const connection = await store.getConnection(userId);
  if (!connection) throw new RequestError(409, "Connect LinkedIn first.");
  return connection;
}

async function own(store: LinkedInStore, userId: string, id: string): Promise<ScheduledPost> {
  const post = await store.getPost(userId, id);
  if (!post) throw new RequestError(404, "No such post.");
  return post;
}

/**
 * Sign-off rule: only a post the person has approved in Studio can go out.
 * Studio has no sign-off state yet, so the caller passes `approved` from the only rule that exists
 * today: the brain is approved and the draft carries no constructed lines. Flagged in the handover.
 */
function requireApproved(approved: boolean) {
  if (!approved) throw new RequestError(403, "Only a post you've signed off in Studio can be published.");
}

export const connections = {
  get: (userId: string) => getStore().getConnection(userId),

  /** Mock mode only: a pretend account whose token lasts the usual 60 days. */
  async connectMock(userId: string, displayName: string) {
    if (!isMockMode()) throw new RequestError(400, "Mock connect is only available with LINKEDIN_PUBLISHER=mock.");
    const expires = new Date(Date.now() + TOKEN_LIFETIME_DAYS * 86_400_000);
    return getStore().upsertConnection({
      userId,
      linkedinMemberUrn: `urn:li:person:mock-${userId.slice(0, 8)}`,
      displayName,
      avatarUrl: null,
      scopes: ["openid", "profile", "email", "w_member_social"],
      accessTokenEncrypted: "mock-token-never-shown",
      tokenExpiresAt: expires.toISOString(),
    });
  },

  /** Mock mode only: age the token so the expired and expiring-soon states can be tried. */
  async setMockExpiry(userId: string, daysFromNow: number) {
    if (!isMockMode()) throw new RequestError(400, "Only in mock mode.");
    const store = getStore();
    const current = await store.getConnectionWithToken(userId);
    if (!current) throw new RequestError(404, "Not connected.");
    const { id: _id, connectedAt: _c, updatedAt: _u, ...rest } = current;
    return store.upsertConnection({ ...rest, tokenExpiresAt: new Date(Date.now() + daysFromNow * 86_400_000).toISOString() });
  },

  disconnect: (userId: string) => getStore().deleteConnection(userId),
};

export const queue = {
  list: (userId: string) => getStore().listPosts(userId),

  async schedule(userId: string, input: { body: string; scheduledFor: string; timezone?: string; studioPostId?: string | null; approved: boolean }) {
    requireApproved(input.approved);
    const store = getStore();
    await requireConnection(store, userId);
    return store.createPost({
      userId,
      studioPostId: input.studioPostId ?? null,
      body: validateBody(input.body),
      media: [],
      scheduledFor: validateFuture(input.scheduledFor),
      timezone: input.timezone ?? "Europe/London",
    });
  },

  async reschedule(userId: string, id: string, scheduledFor: string) {
    const store = getStore();
    const post = await own(store, userId, id);
    if (post.status !== "scheduled" && post.status !== "failed") throw new RequestError(409, "Only a scheduled or failed post can be moved.");
    return store.updatePost(id, { scheduledFor: validateFuture(scheduledFor), status: "scheduled", errorCode: null, errorMessage: null });
  },

  async cancel(userId: string, id: string) {
    const store = getStore();
    const post = await own(store, userId, id);
    if (post.status === "published") throw new RequestError(409, "That post has already gone out.");
    if (post.status === "publishing") throw new RequestError(409, "That post is going out right now.");
    return store.updatePost(id, { status: "cancelled" });
  },

  /** Post now: either a brand-new post from Studio, or an existing queued one brought forward. */
  async publishNow(userId: string, input: { id?: string; body?: string; studioPostId?: string | null; approved: boolean }) {
    const store = getStore();
    let post: ScheduledPost;
    if (input.id) {
      post = await own(store, userId, input.id);
      if (post.status === "published") throw new RequestError(409, "That post has already gone out.");
      if (post.status === "publishing") throw new RequestError(409, "That post is going out right now.");
    } else {
      requireApproved(input.approved);
      await requireConnection(store, userId);
      post = await store.createPost({
        userId,
        studioPostId: input.studioPostId ?? null,
        body: validateBody(input.body ?? ""),
        media: [],
        scheduledFor: new Date().toISOString(),
        timezone: "Europe/London",
      });
    }
    const claimed = await store.updatePost(post.id, { status: "publishing" });
    return publishOne(store, claimed);
  },

  async retry(userId: string, id: string) {
    const store = getStore();
    const post = await own(store, userId, id);
    if (post.status !== "failed") throw new RequestError(409, "Only a failed post can be retried.");
    const claimed = await store.updatePost(id, { status: "publishing" });
    return publishOne(store, claimed);
  },
};

/** Publishes one claimed post and records the outcome. Shared by the worker and by post-now. */
async function publishOne(store: LinkedInStore, post: ScheduledPost): Promise<ScheduledPost> {
  const connection = await store.getConnectionWithToken(post.userId);
  const fail = (code: PublishError["code"], message: string) =>
    store.updatePost(post.id, { status: "failed", errorCode: code, errorMessage: message, attempts: post.attempts + 1 });

  if (!connection || !connection.accessTokenEncrypted) return fail("TOKEN_EXPIRED", "LinkedIn isn't connected.");
  if (isConnectionExpired(connection)) return fail("TOKEN_EXPIRED", "Your LinkedIn connection has expired. Reconnect and retry.");

  try {
    // TODO(dev): decrypt connection.accessTokenEncrypted with TOKEN_ENCRYPTION_KEY here.
    const accessToken = connection.accessTokenEncrypted;
    const publisher = getPublisher();
    const result = await publisher.publishTextPost({
      memberUrn: connection.linkedinMemberUrn,
      accessToken,
      body: escapeForLinkedIn(post.body),
    });
    return store.updatePost(post.id, {
      status: "published",
      linkedinPostUrn: result.postUrn,
      linkedinPostUrl: result.postUrl,
      publishedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
      attempts: post.attempts + 1,
    });
  } catch (error) {
    if (error instanceof PublishError) return fail(error.code, error.message);
    return fail("UNKNOWN", error instanceof Error ? error.message : "Something went wrong.");
  }
}

/**
 * The every-minute job. Claims what's due (atomically, so two workers can't both take a post),
 * then publishes each through the publisher interface.
 * TODO(dev): register the cron. See docs/LINKEDIN_PUBLISHING.md → "The worker".
 */
export async function runWorker(now = new Date()): Promise<{ claimed: number; published: number; failed: number }> {
  const store = getStore();
  const due = await store.claimDuePosts(now);
  let published = 0;
  let failed = 0;
  for (const post of due) {
    const result = await publishOne(store, post);
    if (result.status === "published") published++;
    else failed++;
  }
  return { claimed: due.length, published, failed };
}
