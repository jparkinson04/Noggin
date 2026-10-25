/**
 * Supabase settings from the environment. Without them the app runs on sample data with no
 * sign-in, as it did in phase 1, so a fresh clone still works. See .env.example.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Sign-in and saving are on. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Private. One folder per person: `<user id>/<question id>/<file>`. */
export const VOICE_BUCKET = "voice-notes";
