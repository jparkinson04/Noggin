import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai/extract";
import { currentUser } from "@/lib/auth/currentUser";
import { latestAudit, loadTarget } from "@/lib/audience/store";

/** GET: who they want to reach, their latest audit if there is one, and whether a new one can run. */
export async function GET() {
  const user = await currentUser();
  try {
    const [target, audit] = await Promise.all([loadTarget(user), latestAudit(user)]);
    return NextResponse.json({ target, audit, canRun: aiConfigured() });
  } catch (e) {
    console.error("audience load failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't load your audience." }, { status: 500 });
  }
}
