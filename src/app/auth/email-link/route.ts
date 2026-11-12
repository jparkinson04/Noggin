import { NextResponse } from "next/server";
import { z } from "zod";
import { safeNext } from "@/lib/auth/safeNext";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.string().trim().email(), next: z.string().optional() });

/** What the person sees for the errors Supabase gives when it won't send. */
const WONT_SEND: Record<string, string> = {
  over_email_send_rate_limit: "Too many links asked for. Wait a few minutes and try again.",
  // Supabase's built-in sender only mails the project's team until a real email sender is set up.
  email_address_not_authorized: "Sign-in emails only go to the Supabase project's team until an email sender is set up.",
  signup_disabled: "New sign-ups are switched off.",
  otp_disabled: "New sign-ups are switched off.",
};

/**
 * POST { email, next }: Supabase emails a one-time link (creating the account if it's new).
 * The link comes back to /auth/callback in this browser, which holds the PKCE code verifier.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That isn't an email address." }, { status: 400 });

  const callback = new URL("/auth/callback", req.url);
  callback.searchParams.set("next", safeNext(parsed.data.next));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.toString() },
  });
  if (error) {
    console.error("email-link failed", error.status, error.code); // never the address
    const message = (error.code && WONT_SEND[error.code]) ?? (error.status === 429 ? WONT_SEND.over_email_send_rate_limit : null);
    return NextResponse.json(
      { error: message ?? "Couldn't send the link. Try again in a moment." },
      { status: error.status === 429 ? 429 : 400 }
    );
  }
  return NextResponse.json({ sent: true });
}
