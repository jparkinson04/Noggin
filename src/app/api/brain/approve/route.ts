import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { approveBrain } from "@/lib/brain/store";
import { supabaseConfigured } from "@/lib/supabase/config";

/** POST: "Approve my board". The deep dive is done and every card on the board is theirs. */
export async function POST() {
  if (!supabaseConfigured) return NextResponse.json({ error: "Saving needs Supabase. See .env.example." }, { status: 501 });
  try {
    await approveBrain(await currentUser());
  } catch (e) {
    console.error("approve failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't approve the board." }, { status: 500 });
  }
  return NextResponse.json({ approved: true });
}
