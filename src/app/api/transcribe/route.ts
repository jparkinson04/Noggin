import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/currentUser";
import { transcribe, transcriptionConfigured } from "@/lib/ai/transcribe";
import { supabaseConfigured } from "@/lib/supabase/config";

export const maxDuration = 60;

/**
 * POST multipart { audio } (webm/m4a), returns { transcript }. Deep-dive voice notes are transcribed
 * as they save (see answerStore); this is for anything recorded outside the deep dive.
 * Keep ums and hesitations out, keep phrasing in. The transcript is the person's words; cards quote it.
 * Signed-in only, so the OpenAI key can't be spent by anyone passing by.
 */
export async function POST(req: Request) {
  if (!supabaseConfigured || !transcriptionConfigured()) {
    return NextResponse.json({ error: "Transcription needs sign-in and OPENAI_API_KEY. See .env.example." }, { status: 501 });
  }
  await currentUser();
  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Send the recording as the `audio` field." }, { status: 400 });
  }
  try {
    const name = audio instanceof File && audio.name ? audio.name : "recording.webm";
    return NextResponse.json({ transcript: await transcribe(audio, name) });
  } catch (e) {
    console.error("transcribe failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't transcribe that recording." }, { status: 502 });
  }
}
