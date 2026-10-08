import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getSettingsStore } from "@/lib/settings/store";
import type { Profile } from "@/lib/settings/types";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ profile: await getSettingsStore().getProfile(user.id) });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  const patch = (await req.json()) as Partial<Profile>;
  return NextResponse.json({ profile: await getSettingsStore().updateProfile(user.id, patch) });
}
