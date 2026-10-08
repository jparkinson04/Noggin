import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { queue } from "@/lib/linkedin/service";
import { handle } from "../../_shared";

type Params = { params: Promise<{ id: string }> };

/** PATCH { scheduledFor }: move it. DELETE: cancel it. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await currentUser();
    const { id } = await params;
    const { scheduledFor } = (await req.json()) as { scheduledFor: string };
    return NextResponse.json({ post: await queue.reschedule(user.id, id, scheduledFor) });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await currentUser();
    const { id } = await params;
    return NextResponse.json({ post: await queue.cancel(user.id, id) });
  } catch (e) {
    return handle(e);
  }
}
