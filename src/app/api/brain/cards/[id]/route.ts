import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth/currentUser";
import { CARD_KINDS } from "@/lib/brain/savedBrain";
import { REGION_KEYS, type RegionKey } from "@/lib/brain/schema";
import { deleteCard, saveCard } from "@/lib/brain/store";
import { supabaseConfigured } from "@/lib/supabase/config";

const Body = z.object({
  id: z.string().uuid(),
  regionKey: z.enum(REGION_KEYS as [RegionKey, ...RegionKey[]]),
  kind: z.enum(CARD_KINDS),
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(20_000),
  angles: z.array(z.string().max(500)).max(20),
  keywords: z.array(z.string().max(100)).max(50),
  isLane: z.boolean(),
  constructed: z.boolean(),
  privacy: z.enum(["on_board", "off_board"]),
  funnelDefault: z.enum(["top", "middle", "bottom"]),
  approvedAt: z.string().max(40).optional(),
  sourceAnswerId: z.string().optional(),
});

const NOT_CONFIGURED = { error: "Saving needs Supabase. See .env.example." };

/** PUT: adds a card to the board or saves over it. Row level security keeps it to their own brain. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured) return NextResponse.json(NOT_CONFIGURED, { status: 501 });
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.id !== id) return NextResponse.json({ error: "The card and the address disagree." }, { status: 400 });
  try {
    await saveCard(await currentUser(), parsed.data);
  } catch (e) {
    console.error("card save failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't save that card." }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}

/** DELETE: takes the card off the board for good. Its source answer stays. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured) return NextResponse.json(NOT_CONFIGURED, { status: 501 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "No such card." }, { status: 404 });
  try {
    await deleteCard(await currentUser(), id);
  } catch (e) {
    console.error("card delete failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't remove that card." }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
