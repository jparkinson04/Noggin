"use client";

import { useState } from "react";
import type { Question } from "@/lib/brain/questions";
import {
  EMPTY_ANSWER,
  isThin,
  type Answer,
  type QuestionResponse,
  type VoiceClip,
} from "@/lib/brain/answers";
import { AnswerControl } from "./AnswerControl";
import { GivenAnswer } from "./GivenAnswer";

interface Props {
  question: Question;
  /** "Sitting 2 of 5 · question 3 of 4" */
  progress: string;
  response: QuestionResponse;
  onChange: (response: QuestionResponse) => void;
}

const withClip = (answer: Answer, clip: VoiceClip): Answer => ({
  ...answer,
  clips: [...answer.clips, clip],
});
const withText = (answer: Answer, text: string): Answer => ({ ...answer, text });

const LINK = "text-sm text-secondary underline underline-offset-2 hover:text-ink";

/** One deep-dive question: the question, their answer, what we'd keep, then the second beat. */
export function QuestionScreen({ question, progress, response, onChange }: Props) {
  const { answer, secondBeat, nudge } = response;
  const [addingMore, setAddingMore] = useState(false);
  const [reopenedBeat, setReopenedBeat] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  function saveAnswer(next: Answer) {
    if (addingMore) {
      setAddingMore(false);
      onChange({ ...response, answer: next, nudge: nudge === "showing" ? "done" : nudge });
      return;
    }
    onChange({
      ...response,
      answer: next,
      nudge: nudge === "not_shown" && isThin(next) ? "showing" : nudge,
    });
  }

  function saveSecondBeat(next: Answer | "skipped") {
    setReopenedBeat(false);
    onChange({ ...response, secondBeat: next });
  }

  const beatAnswer = secondBeat && secondBeat !== "skipped" ? secondBeat : undefined;
  const beatOpen = !secondBeat || reopenedBeat;

  return (
    <article>
      <p className="text-sm text-secondary">{progress}</p>
      <h1 className="mt-3 text-3xl md:text-4xl leading-[1.12]">{question.text}</h1>

      {question.whyWeAsk && (
        <p className="mt-5 text-sm text-secondary">
          <button
            type="button"
            className="underline underline-offset-2 hover:text-ink"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((o) => !o)}
          >
            Why we ask
          </button>
          {whyOpen && <span className="ml-3">{question.whyWeAsk}</span>}
        </p>
      )}

      <div className="mt-10">
        {question.safetyLine && <p className="mb-5 text-sm">{question.safetyLine}</p>}

        {!answer || addingMore ? (
          <AnswerControl
            key={addingMore ? "more" : "first"}
            typedSoFar={answer?.text}
            onVoice={(clip) => saveAnswer(withClip(answer ?? EMPTY_ANSWER, clip))}
            onTyped={(text) => saveAnswer(withText(answer ?? EMPTY_ANSWER, text))}
          />
        ) : (
          <>
            <GivenAnswer answer={answer} />
            <p className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {nudge === "showing" && (
                <span>That&apos;s a start. Say a bit more: what did it actually look like?</span>
              )}
              <button type="button" className={LINK} onClick={() => setAddingMore(true)}>
                Add to this answer
              </button>
            </p>
          </>
        )}
      </div>

      {answer && question.secondBeat && (
        <section className="second-beat mt-12 border-t border-hairline pt-8">
          <h2 className="text-xl">{question.secondBeat}</h2>
          <div className="mt-6">
            {beatOpen ? (
              <>
                <AnswerControl
                  small
                  typedSoFar={beatAnswer?.text}
                  onVoice={(clip) => saveSecondBeat(withClip(beatAnswer ?? EMPTY_ANSWER, clip))}
                  onTyped={(text) => saveSecondBeat(withText(beatAnswer ?? EMPTY_ANSWER, text))}
                />
                {!secondBeat && (
                  <button
                    type="button"
                    className={`${LINK} mt-3`}
                    onClick={() => saveSecondBeat("skipped")}
                  >
                    Skip this one
                  </button>
                )}
              </>
            ) : beatAnswer ? (
              <>
                <GivenAnswer answer={beatAnswer} />
                <button type="button" className={`${LINK} mt-5`} onClick={() => setReopenedBeat(true)}>
                  Add to this answer
                </button>
              </>
            ) : (
              <p className="text-sm text-secondary">
                Skipped.{" "}
                <button type="button" className={LINK} onClick={() => setReopenedBeat(true)}>
                  Answer it after all
                </button>
              </p>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
