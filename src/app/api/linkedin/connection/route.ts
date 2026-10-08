import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { connections } from "@/lib/linkedin/service";
import { handle } from "../_shared";

/** GET: the safe view of the connection (never the token). DELETE: disconnect. */
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ connection: await connections.get(user.id) });
}

export async function DELETE() {
  const user = await currentUser();
  await connections.disconnect(user.id);
  return NextResponse.json({ ok: true });
}

/** PATCH { daysFromNow } — mock mode only: age the token to try the expiring and expired states. */
export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    const { daysFromNow } = (await req.json()) as { daysFromNow: number };
    return NextResponse.json({ connection: await connections.setMockExpiry(user.id, Number(daysFromNow)) });
  } catch (e) {
    return handle(e);
  }
}
