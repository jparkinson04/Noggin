"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnswerControl } from "@/components/deepdive/AnswerControl";
import { useBrain } from "@/components/brain/BrainStore";
import { Button } from "@/components/shell/Button";
import { EMPTY_ANSWER, type Answer, type VoiceClip } from "@/lib/brain/answers";

/**
 * "Tell me something", from anywhere. Opened by the top-bar pill and the Home block.
 * Captures stay in memory for now; extraction into cards is wired in a later stage.
 */

interface Capture {
  id: string;
  at: string;
  answer: Answer;
}

interface CaptureState {
  open: () => void;
  captures: Capture[];
}

const Ctx = createContext<CaptureState>({ open: () => {}, captures: [] });

export const useCapture = () => useContext(Ctx);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const { dumps, addDump } = useBrain();
  const captures: Capture[] = dumps;
  const keep = (answer: Answer) => addDump(answer);

  return (
    <Ctx.Provider value={{ open: () => setOpen(true), captures }}>
      {children}
      {isOpen && <CaptureSheet onKeep={keep} onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

function CaptureSheet({ onKeep, onClose }: { onKeep: (a: Answer) => void; onClose: () => void }) {
  const [kept, setKept] = useState<Answer | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finish = (answer: Answer) => {
    onKeep(answer);
    setKept(answer);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ground/80 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] rounded-t-lg border border-hairline bg-ground p-8 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="capture-title" className="text-2xl">
          Tell me something
        </h2>
        <p className="mt-2 text-sm text-secondary">
          A client call, a thought on the train, something someone said. It goes in as it is.
        </p>

        <div className="mt-8">
          {kept ? (
            <p>
              Kept.{" "}
              <span className="text-secondary">
                It&apos;s in your brain as a loose note. You&apos;ll see it land on the map.
              </span>
            </p>
          ) : (
            <AnswerControl
              onVoice={(clip: VoiceClip) => finish({ ...EMPTY_ANSWER, clips: [clip] })}
              onTyped={(text) => finish({ ...EMPTY_ANSWER, text })}
            />
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onClose}>{kept ? "Done" : "Not now"}</Button>
        </div>
      </div>
    </div>
  );
}
