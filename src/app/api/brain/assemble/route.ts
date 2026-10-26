import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { assembleBrain } from "@/lib/brain/store";
import { supabaseConfigured } from "@/lib/supabase/config";

// Transcribing any stragglers and Claude reading the whole deep dive can take a minute or two.
export const maxDuration = 300;

/**
 * POST: "Build my board". Turns their saved deep-dive answers into proposed cards, replacing any
 * already there, and returns the brain as it now stands.
 */
export async function POST() {
  if (!supabaseConfigured) return NextResponse.json({ error: "Saving needs Supabase. See .env.example." }, { status: 501 });
  try {
    return NextResponse.json({ brain: await assembleBrain(await currentUser()) });
  } catch (e) {
    console.error("assemble failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't build the board." }, { status: 500 });
  }
}
