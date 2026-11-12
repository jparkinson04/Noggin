import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth/currentUser";
import { saveTarget } from "@/lib/audience/store";
import { MAX_TARGET_CHARS } from "@/lib/audience/types";

const Body = z.object({
  idealClient: z.string().trim().max(MAX_TARGET_CHARS),
  goal: z.string().trim().max(MAX_TARGET_CHARS),
});

/** PUT: who they want to reach and what they want from them. Saved as typed, never reworded. */
export async function PUT(req: Request) {
  const user = await currentUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: `Keep each one under ${MAX_TARGET_CHARS} characters.` }, { status: 400 });
  try {
    return NextResponse.json({ target: await saveTarget(user, parsed.data) });
  } catch (e) {
    console.error("audience target save failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }
}
