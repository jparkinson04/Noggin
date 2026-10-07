import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Phase 2. The only route that lets AI touch a post. Enforces docs/04-ai-rules.md in code:
 *  - refuses unless the brain is approved
 *  - only accepts approved, on-board cards
 *  - every returned line is constructed until the person keeps it
 */
const Body = z.object({
  action: z.enum(["tighten", "opening_line", "angles", "full_draft"]),
  brainId: z.string(),
  cardId: z.string().optional(),
  angle: z.string().optional(),
  draft: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 501 });
  }

  // TODO phase 2:
  // 1. Load brain; if deep_dive_status !== 'approved' → 403 "Finish your deep dive first."
  // 2. Load the card (approved_at not null, privacy on_board) or 404.
  // 3. Build the system prompt for `action` from src/lib/ai/prompts/, pass the card as JSON
  //    plus the person's vocabulary sample (their transcripts), and the LINKEDIN_ISMS blocklist.
  // 4. Call Anthropic; return { lines: string[], constructed: true }.
  // 5. Log { action, cardId, accepted?: null } for prompt tuning.
  return NextResponse.json({ error: "Not implemented yet." }, { status: 501 });
}
