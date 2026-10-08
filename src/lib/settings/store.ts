import { DEFAULT_SETTINGS, type Profile, type UserSettings } from "./types";
import { sampleBrain } from "@/lib/brain/sampleBrain";

/**
 * Where settings and the profile are read and written. The API routes only talk to this.
 * MemoryStore backs development; SupabaseStore is the real one and is a TODO(dev).
 */
export interface SettingsStore {
  /** Never assumes the row exists: creates it with defaults on first read. */
  get(userId: string): Promise<UserSettings>;
  update(userId: string, patch: Partial<UserSettings>): Promise<UserSettings>;
  getProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile>;
}

export class MemoryStore implements SettingsStore {
  private settings = new Map<string, UserSettings>();
  private profiles = new Map<string, Profile>();

  async get(userId: string) {
    let row = this.settings.get(userId);
    if (!row) {
      row = { ...structuredClone(DEFAULT_SETTINGS), userId, updatedAt: new Date().toISOString() };
      this.settings.set(userId, row);
    }
    return row;
  }
  async update(userId: string, patch: Partial<UserSettings>) {
    const current = await this.get(userId);
    const { userId: _u, updatedAt: _t, ...safe } = patch;
    const next = { ...current, ...safe, updatedAt: new Date().toISOString() };
    this.settings.set(userId, next);
    return next;
  }
  async getProfile(userId: string) {
    let p = this.profiles.get(userId);
    if (!p) {
      const [firstName = "", ...rest] = sampleBrain.ownerName.split(/\s+/);
      p = { firstName, lastName: rest.join(" "), jobTitle: "Career coach", company: "", avatarUrl: null, email: "maya@example.com", oauthProvider: null };
      this.profiles.set(userId, p);
    }
    return p;
  }
  async updateProfile(userId: string, patch: Partial<Profile>) {
    const current = await this.getProfile(userId);
    const { email: _e, oauthProvider: _o, ...safe } = patch; // email and provider change through auth, not here
    const next = { ...current, ...safe };
    this.profiles.set(userId, next);
    return next;
  }
}

/**
 * TODO(dev): the Supabase implementation.
 *  - get: `select * from user_settings where user_id = auth.uid()`; if no row, insert defaults
 *    (the sign-up trigger normally creates it, but never assume).
 *  - update: `update user_settings set … where user_id = auth.uid()`; RLS enforces ownership.
 *  - getProfile/updateProfile: the first_name, last_name, job_title, company and avatar_url columns
 *    on brains, plus email and the provider from auth.getUser() (app_metadata.provider).
 *  - Avatar upload: Storage bucket `avatars` (public read), path `<user_id>/<timestamp>.<ext>`,
 *    then save the public URL to brains.avatar_url.
 */
export class SupabaseStore implements SettingsStore {
  private todo(): never {
    throw new Error("SupabaseStore for settings is not implemented yet.");
  }
  get(): Promise<UserSettings> { return this.todo(); }
  update(): Promise<UserSettings> { return this.todo(); }
  getProfile(): Promise<Profile> { return this.todo(); }
  updateProfile(): Promise<Profile> { return this.todo(); }
}

const g = globalThis as unknown as { __nogginSettingsStore?: SettingsStore };
export function getSettingsStore(): SettingsStore {
  if (!g.__nogginSettingsStore) {
    g.__nogginSettingsStore = process.env.SETTINGS_STORE === "supabase" ? new SupabaseStore() : new MemoryStore();
  }
  return g.__nogginSettingsStore;
}
