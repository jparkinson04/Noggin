import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { queue } from "@/lib/linkedin/service";
import { handle } from "../_shared";

/** GET: the queue. POST: schedule, or publish now with { now: true }. */
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ posts: await queue.list(user.id) });
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const input = (await req.json()) as {
      body: string;
      scheduledFor?: string;
      timezone?: string;
      studioPostId?: string | null;
      approved: boolean;
      now?: boolean;
    };
    const post = input.now
      ? await queue.publishNow(user.id, { body: input.body, studioPostId: input.studioPostId, approved: !!input.approved })
      : await queue.schedule(user.id, {
          body: input.body,
          scheduledFor: input.scheduledFor ?? "",
          timezone: input.timezone,
          studioPostId: input.studioPostId,
          approved: !!input.approved,
        });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return handle(e);
  }
}
