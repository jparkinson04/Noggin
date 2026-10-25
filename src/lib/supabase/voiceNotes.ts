import { createClient } from "./browser";
import { VOICE_BUCKET } from "./config";

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

/**
 * Puts one recording in the person's own folder for this question and returns its Storage path.
 * Browser only: it goes straight to Supabase, so long notes don't hit the server's upload limit.
 */
export async function uploadVoiceNote(userId: string, questionId: string, blob: Blob): Promise<string> {
  const type = blob.type.split(";")[0] || "audio/webm";
  const path = `${userId}/${questionId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[type] ?? "webm"}`;
  const { error } = await createClient().storage.from(VOICE_BUCKET).upload(path, blob, { contentType: type });
  if (error) throw new Error(error.message);
  return path;
}
