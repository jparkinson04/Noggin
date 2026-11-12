import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** POST: signs this browser out (not their other devices) and goes back to sign-in. */
export async function POST(req: Request) {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  // 303 so the browser follows with a GET.
  return NextResponse.redirect(new URL("/sign-in", req.url), { status: 303 });
}
