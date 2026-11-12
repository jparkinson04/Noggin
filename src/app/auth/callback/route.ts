import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/safeNext";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback?code=…&next=…: where the emailed link lands. Swaps the code for a session
 * cookie, then carries on to `next`. Anything wrong goes back to sign-in with a reason.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  // Supabase sends expired or reused links back with error_code=otp_expired.
  const back = new URL("/sign-in", url.origin);
  back.searchParams.set("problem", url.searchParams.get("error_code") === "otp_expired" ? "expired" : "link");
  if (next !== "/") back.searchParams.set("next", next);
  return NextResponse.redirect(back);
}
