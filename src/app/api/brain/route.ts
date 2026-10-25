import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth/currentUser";
import type { BrainFields } from "@/lib/brain/savedBrain";
import { ENGINES, type Engine } from "@/lib/brain/schema";
import { saveBrainFields } from "@/lib/brain/store";
import { supabaseConfigured } from "@/lib/supabase/config";

const EngineName = z.enum(ENGINES as [Engine, ...Engine[]]);
const GoalName = z.enum(["growing_audience", "established_selling", "full_with_clients", "launching"]);
const Percent = z.number().int().min(0).max(100);
const Mix = z.object({ top: Percent, middle: Percent, bottom: Percent });
const Cadence = z.number().int().min(1).max(14);
const Day = z.string().max(40);

const Body = z.object({
  goal: GoalName,
  mix: Mix,
  cadencePerWeek: Cadence,
  enginePrimary: EngineName,
  engineSecondary: EngineName.nullable(),
  engineOverride: z.object({ primary: EngineName, secondary: EngineName.optional(), at: Day }).nullable(),
  quiz: z
    .object({
      blend: z.object({ storyteller: z.number(), teacher: z.number(), commentator: z.number(), documenter: z.number() }),
      primary: EngineName,
      secondary: EngineName.optional(),
      situation: GoalName,
      mix: Mix,
      cadencePerWeek: Cadence,
      quizFlag: z.string().max(1000).nullable(),
      takenAt: Day,
    })
    .nullable(),
  headline: z.string().max(500),
  headlineOptions: z.array(z.string().max(500)).max(3),
}) satisfies z.ZodType<BrainFields>;

/** PUT: the brain's own fields from the Board and the quiz (situation, mix, engine, headline), sent whole. */
export async function PUT(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ error: "Saving needs Supabase. See .env.example." }, { status: 501 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    await saveBrainFields(await currentUser(), parsed.data);
  } catch (e) {
    console.error("brain save failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}
