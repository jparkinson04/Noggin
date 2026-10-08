import { NextResponse } from "next/server";

/**
 * POST { email }: start Supabase's email change.
 * TODO(dev): supabase.auth.updateUser({ email }) with the session client. Supabase sends a
 * confirmation to both addresses (if "secure email change" is on); the address updates once
 * confirmed. Return { pending: true } and let the UI say "Check your inbox".
 */
export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "That isn't an email address." }, { status: 400 });
  return NextResponse.json({ pending: true, message: `Not wired yet. Supabase would email ${email} to confirm.` });
}
