import { NextResponse } from "next/server";

/**
 * Phase 2. Accepts multipart form with `audio` (webm/m4a), returns { transcript }.
 * Pick one provider and delete the other branch:
 *  - OpenAI Whisper: POST https://api.openai.com/v1/audio/transcriptions (model whisper-1)
 *  - Deepgram: POST https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true
 * Keep ums and hesitations out, keep phrasing in. The transcript is the person's words; cards quote it.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Send the recording as the `audio` field." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY && !process.env.DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "No transcription provider configured. Set OPENAI_API_KEY or DEEPGRAM_API_KEY." },
      { status: 501 }
    );
  }
  // TODO phase 2: forward `audio` to the provider and return { transcript }.
  return NextResponse.json({ error: "Not implemented yet." }, { status: 501 });
}
