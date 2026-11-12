import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { deleteAudit } from "@/lib/audience/store";

/** DELETE: removes an audit and every name in it. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await params;
  try {
    await deleteAudit(user, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("audience audit delete failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't delete that." }, { status: 500 });
  }
}
