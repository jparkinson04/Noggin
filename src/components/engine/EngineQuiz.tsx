"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { EngineResult } from "@/components/engine/EngineResult";
import { ButtonLink } from "@/components/shell/Button";
import { Narrow } from "@/components/shell/Narrow";
import { QUIZ, scoreQuiz, type QuizAnswers } from "@/lib/engine/quiz";

/**
 * The content engine quiz, one question per screen in the deep-dive room.
 * Signed out it ends in sign-up; signed in it is the first step of onboarding.
 */
export function EngineQuiz({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const { setQuiz } = useBrain();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);

  function choose(option: number) {
    const next = { ...answers, [QUIZ[index].id]: option };
    setAnswers(next);
    if (index < QUIZ.length - 1) {
      setIndex(index + 1);
      return;
    }
    const scored = scoreQuiz(next);
    if (signedIn) setQuiz(scored);
    setResult(scored);
  }

  if (result) {
    return (
      <Narrow>
        <EngineResult
          result={result}
          action={
            signedIn ? (
              <ButtonLink href="/deep-dive" variant="primary">
                Start your deep dive
              </ButtonLink>
            ) : (
              // Sign-up doesn't exist yet; the result travels in the query string so it can be kept on arrival.
              <ButtonLink href={`/sign-up?engine=${encodeURIComponent(JSON.stringify(result))}`} variant="primary">
                Build the material
              </ButtonLink>
            )
          }
        />
      </Narrow>
    );
  }

  const question = QUIZ[index];
  return (
    <div className="relative min-h-screen px-4 pb-24 pt-16 md:px-6 md:pt-24">
      <Link href="/" aria-label="Noggin home" className="absolute right-4 top-5 md:right-8 md:top-6">
        <img src="/logo-dark.svg" alt="" className="h-[18px] w-auto" />
      </Link>
      <div className="mx-auto w-full max-w-[760px]">
        <p className="text-sm text-secondary">
          Question {index + 1} of {QUIZ.length}
        </p>
        <h1 className="mt-3 text-3xl leading-[1.15] md:text-[2.25rem]">{question.text}</h1>
        <ul className="mt-10 border-b border-hairline">
          {question.options.map((option, i) => (
            <li key={option.text} className="border-t border-hairline">
              <button
                type="button"
                onClick={() => choose(i)}
                className="flex min-h-11 w-full items-center py-3 text-left hover:text-signal"
              >
                {option.text}
              </button>
            </li>
          ))}
        </ul>
        {index > 0 ? (
          <button
            type="button"
            className="mt-8 text-sm text-secondary underline underline-offset-2 hover:text-ink"
            onClick={() => setIndex(index - 1)}
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            className="mt-8 text-sm text-secondary underline underline-offset-2 hover:text-ink"
            onClick={() => router.back()}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
