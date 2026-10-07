"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainMap } from "@/components/brain/BrainMap";
import { useBrain } from "@/components/brain/BrainStore";
import { QuestionScreen } from "@/components/deepdive/QuestionScreen";
import { Button } from "@/components/shell/Button";
import { NO_RESPONSE, type QuestionResponse } from "@/lib/brain/answers";
import { DEEP_DIVE_QUESTIONS, QUESTIONS, SITTINGS, questionsInSitting } from "@/lib/brain/questions";
import { REGION_KEYS, type RegionKey } from "@/lib/brain/schema";

/** The deep dive: a blank room, one question at a time. Also hosts a weekly top-up question. */
export function DeepDiveQuestions({ startAt }: { startAt: string }) {
  // Local state only for now: answers live in memory and go when the page reloads.
  const router = useRouter();
  const { assemble, markTopUpAnswered } = useBrain();
  const [id, setId] = useState(startAt);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});

  const question = QUESTIONS.find((q) => q.id === id) ?? DEEP_DIVE_QUESTIONS[0];
  const index = DEEP_DIVE_QUESTIONS.indexOf(question);
  const response = responses[question.id] ?? NO_RESPONSE;

  const progress = question.topUp
    ? "One more for your brain"
    : `Sitting ${question.sitting} of ${SITTINGS.length} · question ${question.position} of ${
        questionsInSitting(question.sitting!).length
      }`;

  // Only the regions with an answer so far light up.
  const heat = useMemo(() => {
    const touched = new Set(
      Object.entries(responses)
        .filter(([, r]) => r.answer)
        .map(([qid]) => QUESTIONS.find((q) => q.id === qid)?.region)
    );
    return Object.fromEntries(REGION_KEYS.map((k) => [k, touched.has(k) ? 1 : 0])) as Record<RegionKey, number>;
  }, [responses]);

  const prev = index > 0 ? DEEP_DIVE_QUESTIONS[index - 1] : null;
  const next = index >= 0 && index < DEEP_DIVE_QUESTIONS.length - 1 ? DEEP_DIVE_QUESTIONS[index + 1] : null;

  return (
    <div className="relative min-h-screen px-4 pb-40 pt-16 md:px-6 md:pt-24">
      <Link href="/" aria-label="Noggin home" className="absolute right-4 top-5 md:right-8 md:top-6">
        <img src="/logo-dark.svg" alt="" className="h-[18px] w-auto" />
      </Link>

      <div className="mx-auto w-full max-w-[760px]">
        <QuestionScreen
          key={question.id}
          question={question}
          progress={progress}
          response={response}
          onChange={(nextResponse) => setResponses((all) => ({ ...all, [question.id]: nextResponse }))}
        />
        <div className="mt-12 flex items-center gap-5">
          {question.topUp ? (
            response.answer && (
              <Button
                variant="primary"
                onClick={() => {
                  markTopUpAnswered();
                  router.push("/");
                }}
              >
                Done
              </Button>
            )
          ) : next ? (
            <Button variant="primary" disabled={!response.answer} onClick={() => setId(next.id)}>
              Next question
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!response.answer}
              onClick={() => {
                // Every typed answer becomes a source; voice-only answers wait for transcription.
                const date = new Date().toISOString().slice(0, 10);
                assemble(
                  DEEP_DIVE_QUESTIONS.flatMap((q) => {
                    const r = responses[q.id];
                    if (!r?.answer) return [];
                    const beat = r.secondBeat && r.secondBeat !== "skipped" ? r.secondBeat.text : "";
                    const text = [r.answer.text, beat].filter(Boolean).join(" ");
                    return text ? [{ id: `a_${q.id}`, questionId: q.id, text, date }] : [];
                  })
                );
                router.push("/brain/board");
              }}
            >
              Build my board
            </Button>
          )}
          {prev && (
            <button
              type="button"
              className="text-sm text-secondary underline underline-offset-2 hover:text-ink"
              onClick={() => setId(prev.id)}
            >
              Previous question
            </button>
          )}
        </div>
      </div>

      <figure className="mx-auto mt-16 w-[180px] max-w-[760px] md:fixed md:bottom-8 md:left-8 md:mt-0">
        <BrainMap heat={heat} compact onlyWarm />
        <figcaption className="mt-2 text-xs text-secondary">Your brain, so far</figcaption>
      </figure>
    </div>
  );
}
