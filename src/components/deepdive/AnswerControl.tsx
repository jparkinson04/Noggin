"use client";

import { useEffect, useRef, useState } from "react";
import { durationLabel, type VoiceClip } from "@/lib/brain/answers";
import { Button } from "@/components/shell/Button";
import { MicIcon } from "@/components/shell/MicIcon";

interface Props {
  onVoice: (clip: VoiceClip) => void;
  onTyped: (text: string) => void;
  /** What they've already typed, when they come back to add more. */
  typedSoFar?: string;
  /** The second beat gets a smaller button so the first question stays the main event. */
  small?: boolean;
}

/** Record a voice note (the big button) or type instead (the small link). */
export function AnswerControl({ onVoice, onTyped, typedSoFar = "", small = false }: Props) {
  const [typing, setTyping] = useState(typedSoFar.length > 0);
  const [text, setText] = useState(typedSoFar);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!recording) return;
    const tick = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    return () => clearInterval(tick);
  }, [recording]);

  // Leaving the screen mid-recording drops the take and releases the microphone.
  useEffect(() => {
    return () => {
      const r = recorder.current;
      if (r && r.state !== "inactive") {
        r.onstop = null;
        r.stream.getTracks().forEach((t) => t.stop());
        r.stop();
      }
    };
  }, []);

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        const seconds = (Date.now() - startedAt.current) / 1000;
        setRecording(false);
        onVoice({ url: URL.createObjectURL(blob), seconds });
      };
      startedAt.current = Date.now();
      setElapsed(0);
      r.start();
      recorder.current = r;
      setRecording(true);
    } catch {
      setMicError("The microphone is blocked. Allow it in your browser, or type instead.");
    }
  }

  function stopRecording() {
    recorder.current?.stop();
  }

  if (typing) {
    return (
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          placeholder="Say it the way you'd say it out loud."
          className="w-full min-h-[200px] max-w-[68ch] resize-y bg-transparent text-md leading-[1.65] placeholder:text-muted focus-visible:outline-none"
        />
        <div className="mt-3 flex items-center gap-5">
          <Button variant="primary" disabled={!text.trim()} onClick={() => onTyped(text.trim())}>
            Save answer
          </Button>
          <button
            type="button"
            className="text-sm text-secondary underline underline-offset-2 hover:text-ink"
            onClick={() => setTyping(false)}
          >
            Record instead
          </button>
        </div>
      </div>
    );
  }

  const size = small ? "h-16 w-16" : "h-24 w-24";

  return (
    <div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          aria-label={recording ? "Stop recording" : "Record your answer"}
          className={`relative ${size} shrink-0 rounded-full bg-signal text-ink flex items-center justify-center`}
        >
          {recording && <span aria-hidden className="recording-ring absolute inset-0 rounded-full" />}
          {recording ? (
            <span aria-hidden className={`${small ? "h-4 w-4" : "h-6 w-6"} rounded-sm bg-ink`} />
          ) : (
            <MicIcon size={small ? 22 : 34} />
          )}
        </button>
        <p>
          {recording ? (
            <>
              <span className="display text-xl tabular-nums">{durationLabel(elapsed)}</span>
              <span className="block text-sm text-secondary">Press again to stop</span>
            </>
          ) : (
            <>
              <span className={small ? "text-sm" : "text-base"}>Record your answer</span>
              <span className="block text-sm text-secondary">
                Talk for as long as you like.{" "}
                <button
                  type="button"
                  className="text-ink underline underline-offset-2"
                  onClick={() => setTyping(true)}
                >
                  Type instead
                </button>
              </span>
            </>
          )}
        </p>
      </div>
      {micError && <p className="mt-3 text-sm">{micError}</p>}
    </div>
  );
}
