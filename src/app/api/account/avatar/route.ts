import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getSettingsStore } from "@/lib/settings/store";

/**
 * POST multipart { photo }: the profile photo.
 * TODO(dev): upload to the Supabase Storage bucket `avatars` at `<user_id>/<timestamp>.<ext>`
 * (createServerClient with the session; bucket public-read), then save the public URL on
 * brains.avatar_url. For now the image is kept inline as a data URL so the UI works end to end.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  const form = await req.formData();
  const photo = form.get("photo");
  if (!(photo instanceof Blob)) return NextResponse.json({ error: "Send the image as the `photo` field." }, { status: 400 });
  if (photo.size > 2_000_000) return NextResponse.json({ error: "Keep the photo under 2 MB." }, { status: 400 });
  const bytes = Buffer.from(await photo.arrayBuffer()).toString("base64");
  const avatarUrl = `data:${photo.type || "image/jpeg"};base64,${bytes}`;
  return NextResponse.json({ profile: await getSettingsStore().updateProfile(user.id, { avatarUrl }) });
}

export async function DELETE() {
  const user = await currentUser();
  return NextResponse.json({ profile: await getSettingsStore().updateProfile(user.id, { avatarUrl: null }) });
}
