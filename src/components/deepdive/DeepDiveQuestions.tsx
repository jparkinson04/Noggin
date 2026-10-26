"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainMap } from "@/components/brain/BrainMap";
import { useBrain } from "@/components/brain/BrainStore";
import { QuestionScreen } from "@/components/deepdive/QuestionScreen";
import { useSavedResponses } from "@/components/deepdive/useSavedResponses";
import { Button } from "@/components/shell/Button";
import { NO_RESPONSE, answerWords, type QuestionResponse } from "@/lib/brain/answers";
import { DEEP_DIVE_QUESTIONS, QUESTIONS, SITTINGS, questionsInSitting } from "@/lib/brain/questions";
import { REGION_KEYS, type RegionKey, type SourceAnswer } from "@/lib/brain/schema";

interface Props {
  startAt: string;
  /** What they've said in earlier visits. */
  saved: Record<string, QuestionResponse>;
  userId: string;
}

/** The deep dive: a blank room, one question at a time. Also hosts a weekly top-up question. */
export function DeepDiveQuestions({ startAt, saved, userId }: Props) {
  // Each answer saves as it's given. Without Supabase they live in memory and go when the page reloads.
  const router = useRouter();
  const { assemble, markTopUpAnswered, noteProgress } = useBrain();
  const [id, setId] = useState(startAt);
  const { responses, change, failed, retry, flush } = useSavedResponses(saved, userId);
  const [building, setBuilding] = useState(false);
  const [buildFailed, setBuildFailed] = useState(false);

  useEffect(() => noteProgress(Object.keys(responses).filter((qid) => responses[qid].answer)), [responses, noteProgress]);

  async function buildBoard() {
    setBuilding(true);
    setBuildFailed(false);
    // Every answer with words in it becomes a source: typed, or voice once it's transcribed.
    // With Supabase the server rebuilds these from what's saved; this is for the sample brain.
    const date = new Date().toISOString().slice(0, 10);
    const sources: SourceAnswer[] = DEEP_DIVE_QUESTIONS.flatMap((q) => {
      const r = responses[q.id];
      if (!r?.answer) return [];
      const beat = r.secondBeat && r.secondBeat !== "skipped" ? answerWords(r.secondBeat) : "";
      const text = [answerWords(r.answer), beat].filter(Boolean).join(" ");
      return text ? [{ id: `a_${q.id}`, questionId: q.id, text, date }] : [];
    });
    // The board is built from what's saved, so every answer has to land first.
    if ((await flush()) && (await assemble(sources))) {
      router.push("/brain/board");
      return;
    }
    setBuilding(false);
    setBuildFailed(true);
  }

  const question = QUESTIONS.find((q) => q.id === id) ?? DEEP_DIVE_QUESTIONS[0];
  const index = DEEP_DIVE_QUESTIONS.indexOf(question);
  const response = responses[question.id] ?? NO_RESPONSE;

  const progress = question.topUp
    ? "One more for your brain"
    : `Sitting ${question.sitting} of ${SITTINGS.length} · question ${question.position} of ${
        questionsInSitting(question.sitting!).length
      }`;

  // Only the regions with an answer so far light up, and each answer grows its region a little.
  const answered = useMemo(() => {
    const counts = Object.fromEntries(REGION_KEYS.map((k) => [k, 0])) as Record<RegionKey, number>;
    for (const [qid, r] of Object.entries(responses)) {
      const region = QUESTIONS.find((q) => q.id === qid)?.region;
      if (r.answer && region) counts[region]++;
    }
    return counts;
  }, [responses]);
  const heat = useMemo(
    () => Object.fromEntries(REGION_KEYS.map((k) => [k, answered[k] > 0 ? 1 : 0])) as Record<RegionKey, number>,
    [answered]
  );

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
          onChange={(nextResponse) => change(question.id, nextResponse)}
        />
        {building && (
          <p className="mt-8 text-sm text-secondary">
            Picking out your stories, opinions and proof, in your words. This takes a minute or two.
          </p>
        )}
        {buildFailed && (
          <p role="alert" className="mt-8 text-sm">
            Couldn&apos;t build your board just now. Everything you&apos;ve said is still here, so try again in a moment.
          </p>
        )}
        {failed.has(question.id) && (
          <p role="alert" className="mt-8 text-sm">
            Couldn&apos;t save this answer. It&apos;s still here.{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-ink"
              onClick={() => retry(question.id)}
            >
              Try again
            </button>
          </p>
        )}
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
            <Button variant="primary" disabled={!response.answer || building} onClick={buildBoard}>
              {building ? "Reading your answers" : "Build my board"}
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
        <BrainMap heat={heat} anchors={answered} compact onlyWarm />
        <figcaption className="mt-2 text-xs text-secondary">Your brain, so far</figcaption>
      </figure>
    </div>
  );
}
