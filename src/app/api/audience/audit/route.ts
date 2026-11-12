import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai/extract";
import type { Screenshot } from "@/lib/ai/audience";
import { currentUser } from "@/lib/auth/currentUser";
import { NoTargetError, NothingReadError, runAudit } from "@/lib/audience/audit";
import {
  MAX_PASTED_CHARS,
  MAX_SCREENSHOTS,
  MAX_SCREENSHOT_BYTES,
  SCREENSHOT_TYPES,
  type ScreenshotType,
} from "@/lib/audience/types";

// Reading a dozen screenshots can take a little while.
export const maxDuration = 120;

const isScreenshotType = (type: string): type is ScreenshotType => (SCREENSHOT_TYPES as readonly string[]).includes(type);

/**
 * POST (multipart): `screenshots` files and/or a `pasted` text field. Reads who reacted, sorts them
 * against who the person wants to reach, saves the audit and returns it. The person pressed a
 * button for this, and the files are never stored.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!aiConfigured()) return NextResponse.json({ error: "Reading screenshots needs ANTHROPIC_API_KEY. See .env.example." }, { status: 501 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Send the screenshots as a form." }, { status: 400 });
  }
  const files = form.getAll("screenshots").filter((f): f is File => f instanceof File && f.size > 0);
  const pasted = String(form.get("pasted") ?? "").slice(0, MAX_PASTED_CHARS);
  if (files.length === 0 && !pasted.trim()) return NextResponse.json({ error: "Add a screenshot or paste a list first." }, { status: 400 });
  if (files.length > MAX_SCREENSHOTS) return NextResponse.json({ error: `Up to ${MAX_SCREENSHOTS} screenshots at a time.` }, { status: 400 });

  const screenshots: Screenshot[] = [];
  for (const file of files) {
    if (!isScreenshotType(file.type)) return NextResponse.json({ error: "Screenshots need to be PNG, JPEG or WebP." }, { status: 400 });
    if (file.size > MAX_SCREENSHOT_BYTES) return NextResponse.json({ error: "Each screenshot needs to be under 5 MB." }, { status: 400 });
    screenshots.push({ type: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") });
  }

  try {
    return NextResponse.json(await runAudit(user, screenshots, pasted));
  } catch (e) {
    if (e instanceof NoTargetError) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof NothingReadError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("audience audit failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't read those. Nothing was saved." }, { status: 500 });
  }
}
