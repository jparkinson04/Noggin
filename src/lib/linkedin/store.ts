import type { LinkedInConnection, PublishErrorCode, ScheduledPost } from "./types";

/**
 * Where connections and the queue live. The service layer only ever talks to this interface.
 * MemoryStore backs mock mode; SupabaseStore is the real one and is a TODO(dev).
 */

/** The connection plus the one thing the browser must never see. Service role only. */
export interface ConnectionWithToken extends LinkedInConnection {
  accessTokenEncrypted: string | null;
}

export type NewScheduledPost = Pick<ScheduledPost, "userId" | "studioPostId" | "body" | "media" | "scheduledFor" | "timezone">;

export interface LinkedInStore {
  getConnection(userId: string): Promise<LinkedInConnection | null>;
  /** Service role only. Never return this to a route that answers the browser. */
  getConnectionWithToken(userId: string): Promise<ConnectionWithToken | null>;
  upsertConnection(connection: Omit<ConnectionWithToken, "id" | "connectedAt" | "updatedAt">): Promise<LinkedInConnection>;
  deleteConnection(userId: string): Promise<void>;

  listPosts(userId: string): Promise<ScheduledPost[]>;
  getPost(userId: string, id: string): Promise<ScheduledPost | null>;
  createPost(post: NewScheduledPost): Promise<ScheduledPost>;
  updatePost(id: string, patch: Partial<ScheduledPost>): Promise<ScheduledPost>;
  /** UPDATE … SET status='publishing' WHERE status='scheduled' AND scheduled_for <= now() RETURNING. */
  claimDuePosts(now: Date, batch?: number): Promise<ScheduledPost[]>;
}

const iso = (d = new Date()) => d.toISOString();
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/**
 * In-memory, per server process. Fine for clicking through mock mode locally; on serverless
 * hosting each instance has its own copy, so state can vanish between requests.
 */
export class MemoryStore implements LinkedInStore {
  private connections = new Map<string, ConnectionWithToken>();
  private posts = new Map<string, ScheduledPost>();

  private strip(c: ConnectionWithToken): LinkedInConnection {
    const { accessTokenEncrypted: _token, ...safe } = c; // never leaves the store
    return safe;
  }

  async getConnection(userId: string) {
    const c = this.connections.get(userId);
    return c ? this.strip(c) : null;
  }
  async getConnectionWithToken(userId: string) {
    return this.connections.get(userId) ?? null;
  }
  async upsertConnection(input: Omit<ConnectionWithToken, "id" | "connectedAt" | "updatedAt">) {
    const existing = this.connections.get(input.userId);
    const c: ConnectionWithToken = {
      ...input,
      id: existing?.id ?? newId(),
      connectedAt: iso(),
      updatedAt: iso(),
    };
    this.connections.set(input.userId, c);
    return this.strip(c);
  }
  async deleteConnection(userId: string) {
    this.connections.delete(userId);
  }

  async listPosts(userId: string) {
    return [...this.posts.values()].filter((p) => p.userId === userId).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  }
  async getPost(userId: string, id: string) {
    const p = this.posts.get(id);
    return p && p.userId === userId ? p : null;
  }
  async createPost(input: NewScheduledPost) {
    const p: ScheduledPost = {
      ...input,
      id: newId(),
      status: "scheduled",
      linkedinPostUrn: null,
      linkedinPostUrl: null,
      errorCode: null,
      errorMessage: null,
      attempts: 0,
      publishedAt: null,
      createdAt: iso(),
      updatedAt: iso(),
    };
    this.posts.set(p.id, p);
    return p;
  }
  async updatePost(id: string, patch: Partial<ScheduledPost>) {
    const p = this.posts.get(id);
    if (!p) throw new Error(`No scheduled post ${id}`);
    const next = { ...p, ...patch, updatedAt: iso() };
    this.posts.set(id, next);
    return next;
  }
  async claimDuePosts(now: Date, batch = 20) {
    const due = [...this.posts.values()]
      .filter((p) => p.status === "scheduled" && p.scheduledFor <= now.toISOString())
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
      .slice(0, batch);
    return Promise.all(due.map((p) => this.updatePost(p.id, { status: "publishing" })));
  }
}

/**
 * TODO(dev): the Supabase implementation.
 *  - Browser-facing reads use the `linkedin_connection_public` view; the token column is not granted.
 *  - getConnectionWithToken, upsertConnection and claimDuePosts run with the service role key
 *    (server only). claimDuePosts calls the `claim_due_scheduled_posts(batch)` function from the
 *    migration, which does the atomic UPDATE … RETURNING with FOR UPDATE SKIP LOCKED.
 *  - Encrypt/decrypt the token with TOKEN_ENCRYPTION_KEY (AES-256-GCM) in the service layer,
 *    never in a component.
 */
export class SupabaseStore implements LinkedInStore {
  private todo(): never {
    throw new Error("SupabaseStore is not implemented yet. Set LINKEDIN_PUBLISHER=mock or see docs/LINKEDIN_PUBLISHING.md.");
  }
  getConnection(): Promise<LinkedInConnection | null> { return this.todo(); }
  getConnectionWithToken(): Promise<ConnectionWithToken | null> { return this.todo(); }
  upsertConnection(): Promise<LinkedInConnection> { return this.todo(); }
  deleteConnection(): Promise<void> { return this.todo(); }
  listPosts(): Promise<ScheduledPost[]> { return this.todo(); }
  getPost(): Promise<ScheduledPost | null> { return this.todo(); }
  createPost(): Promise<ScheduledPost> { return this.todo(); }
  updatePost(): Promise<ScheduledPost> { return this.todo(); }
  claimDuePosts(): Promise<ScheduledPost[]> { return this.todo(); }
}

// One store per process. In dev, Next reloads modules, so pin it on globalThis to survive HMR.
const g = globalThis as unknown as { __nogginLinkedInStore?: LinkedInStore };
export function getStore(): LinkedInStore {
  if (!g.__nogginLinkedInStore) {
    g.__nogginLinkedInStore = process.env.LINKEDIN_PUBLISHER === "live" ? new SupabaseStore() : new MemoryStore();
  }
  return g.__nogginLinkedInStore;
}

export type { PublishErrorCode };
