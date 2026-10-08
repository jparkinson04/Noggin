import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getSettingsStore } from "@/lib/settings/store";
import type { UserSettings } from "@/lib/settings/types";

/** GET: the row, created with defaults if missing. PATCH: a partial update. */
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ settings: await getSettingsStore().get(user.id) });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  const patch = (await req.json()) as Partial<UserSettings>;
  if (patch.weeklyPostGoal !== undefined && (patch.weeklyPostGoal < 1 || patch.weeklyPostGoal > 7)) {
    return NextResponse.json({ error: "Posts per week is 1 to 7." }, { status: 400 });
  }
  if (patch.timezone !== undefined) {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: patch.timezone });
    } catch {
      return NextResponse.json({ error: "That isn't a timezone." }, { status: 400 });
    }
  }
  return NextResponse.json({ settings: await getSettingsStore().update(user.id, patch) });
}
