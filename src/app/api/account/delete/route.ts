import { NextResponse } from "next/server";

/**
 * POST { confirm: "delete" }: delete the account. Nothing is deleted yet.
 * TODO(dev): with the service role client:
 *   1. list and remove the user's Storage objects (voice-notes/<user>, photos/<user>, avatars/<user>)
 *   2. supabase.auth.admin.deleteUser(userId) — the foreign keys cascade brains, cards, posts,
 *      answers, dumps, scheduled_posts, linkedin_connections and user_settings
 *   3. sign the session out and redirect to the marketing site
 * Require a fresh sign-in (reauthenticate) before step 2.
 */
export async function POST(req: Request) {
  const { confirm } = (await req.json()) as { confirm?: string };
  if (confirm !== "delete") return NextResponse.json({ error: 'Type "delete" to confirm.' }, { status: 400 });
  return NextResponse.json({ error: "Account deletion isn't wired up yet. Nothing was deleted." }, { status: 501 });
}
