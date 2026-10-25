"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Answer, QuestionResponse, VoiceClip } from "@/lib/brain/answers";
import type { SavedAnswer, SavedResponse } from "@/lib/brain/savedAnswers";
import { supabaseConfigured } from "@/lib/supabase/config";

// The Supabase client is most of this page's weight, so it only loads when a voice note needs saving.
const uploadVoiceNote = async (userId: string, questionId: string, blob: Blob) =>
  (await import("@/lib/supabase/voiceNotes")).uploadVoiceNote(userId, questionId, blob);

/**
 * The deep dive's responses, saved as the person goes. Each change uploads any new voice notes,
 * then saves that question's whole response; saves for one question run in order. Without
 * Supabase everything stays in memory, as before.
 */
export function useSavedResponses(initial: Record<string, QuestionResponse>, userId: string) {
  const [responses, setResponses] = useState(initial);
  /** Questions whose last save didn't go through. */
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const queues = useRef(new Map<string, Promise<void>>());
  /** Object URL → Storage path, so a note is only uploaded once however many saves include it. */
  const uploads = useRef(new Map<string, Promise<string>>());
  const inFlight = useRef(0);

  // Closing the tab mid-upload would lose the voice note, so the browser asks first.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (inFlight.current > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const pathFor = useCallback(
    (questionId: string, clip: VoiceClip): Promise<string> => {
      if (clip.path) return Promise.resolve(clip.path);
      let upload = uploads.current.get(clip.url);
      if (!upload) {
        if (!clip.blob) return Promise.reject(new Error("The recording is no longer here."));
        upload = uploadVoiceNote(userId, questionId, clip.blob);
        upload.catch(() => uploads.current.delete(clip.url)); // so trying again uploads again
        uploads.current.set(clip.url, upload);
      }
      return upload;
    },
    [userId]
  );

  const saved = useCallback(
    async (questionId: string, answer: Answer): Promise<SavedAnswer> => ({
      text: answer.text,
      clips: await Promise.all(answer.clips.map(async (c) => ({ path: await pathFor(questionId, c), seconds: c.seconds }))),
    }),
    [pathFor]
  );

  const save = useCallback(
    async (questionId: string, response: QuestionResponse) => {
      if (!response.answer) return;
      const { secondBeat } = response;
      const body: SavedResponse = {
        answer: await saved(questionId, response.answer),
        secondBeat: secondBeat === "skipped" ? "skipped" : secondBeat ? await saved(questionId, secondBeat) : null,
      };
      const r = await fetch(`/api/deep-dive/answers/${questionId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Save failed with ${r.status}`);
    },
    [saved]
  );

  const change = useCallback(
    (questionId: string, response: QuestionResponse) => {
      setResponses((all) => ({ ...all, [questionId]: response }));
      if (!supabaseConfigured) return;
      inFlight.current++;
      const run = (queues.current.get(questionId) ?? Promise.resolve())
        .then(() => save(questionId, response))
        .then(
          () =>
            setFailed((f) => {
              const next = new Set(f);
              next.delete(questionId);
              return next;
            }),
          () => setFailed((f) => new Set(f).add(questionId))
        )
        .finally(() => inFlight.current--);
      queues.current.set(questionId, run);
    },
    [save]
  );

  const retry = useCallback(
    (questionId: string) => {
      const response = responses[questionId];
      if (response) change(questionId, response);
    },
    [responses, change]
  );

  return { responses, change, failed, retry };
}
