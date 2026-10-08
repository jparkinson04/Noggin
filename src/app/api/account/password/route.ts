import { NextResponse } from "next/server";

/**
 * POST { password }: change the password.
 * TODO(dev): supabase.auth.updateUser({ password }) with the session client. Supabase requires a
 * recent sign-in for this; on AuthApiError "reauthentication needed", call auth.reauthenticate()
 * and ask for the emailed code. Don't log the password.
 */
export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  if (!password || password.length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Not wired yet. Supabase would update the password." });
}
