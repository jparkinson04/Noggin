/**
 * Speech to text for voice notes, through OpenAI. Server only. The transcript is the person's
 * words and cards quote it, so it keeps their phrasing and only drops the ums.
 */

// gpt-4o-mini-transcribe is the cheapest of OpenAI's (about $0.003 a minute). Set TRANSCRIBE_MODEL
// to move to another, e.g. when OpenAI retires this one.
const MODEL = process.env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
const MAX_BYTES = 25 * 1024 * 1024; // OpenAI's limit per file

export function transcriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** The words in one recording. `filename` needs the right extension: OpenAI reads the format from it. */
export async function transcribe(audio: Blob, filename: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");
  if (audio.size > MAX_BYTES) throw new Error("The recording is over OpenAI's 25 MB limit.");

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", MODEL);
  form.append("language", "en");
  form.append("response_format", "json");
  form.append("prompt", "Keep the speaker's own words and phrasing, with punctuation. Leave out ums, ahs and false starts.");

  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Transcription failed with ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const { text } = (await r.json()) as { text?: string };
  return (text ?? "").trim();
}
