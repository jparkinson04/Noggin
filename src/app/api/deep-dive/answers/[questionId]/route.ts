import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { saveResponse } from "@/lib/brain/answerStore";
import { QUESTIONS } from "@/lib/brain/questions";
import { allClips, hasContent, SavedResponseBody } from "@/lib/brain/savedAnswers";
import { supabaseConfigured } from "@/lib/supabase/config";

// New voice notes are transcribed during the save, which can take a while for a long one.
export const maxDuration = 60;

/**
 * PUT { answer, secondBeat }: saves one deep-dive question's response over the last save.
 * Voice notes are uploaded from the browser first, into the person's own folder for this question,
 * and come back transcribed: the response carries every transcript the answer has, by path.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  if (!supabaseConfigured) return NextResponse.json({ error: "Saving needs Supabase. See .env.example." }, { status: 501 });
  const { questionId } = await params;
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) return NextResponse.json({ error: "No such question." }, { status: 404 });

  const parsed = SavedResponseBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasContent(parsed.data.answer)) return NextResponse.json({ error: "There's no answer to save." }, { status: 400 });

  const user = await currentUser();
  const folder = `${user.id}/${question.id}/`;
  if (allClips(parsed.data).some((c) => !c.path.startsWith(folder) || c.path.includes(".."))) {
    return NextResponse.json({ error: "Voice notes have to be in your own folder for this question." }, { status: 400 });
  }

  try {
    return NextResponse.json({ saved: true, transcripts: await saveResponse(user, question, parsed.data) });
  } catch (e) {
    console.error("deep-dive save failed", question.id, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't save that answer." }, { status: 500 });
  }
}
