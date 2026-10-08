import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { queue } from "@/lib/linkedin/service";
import { handle } from "../../../_shared";

/** POST: publish a queued post now. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    const { id } = await params;
    return NextResponse.json({ post: await queue.publishNow(user.id, { id, approved: true }) });
  } catch (e) {
    return handle(e);
  }
}
