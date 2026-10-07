"use client";

import { useState } from "react";
import type { Engine, EngineEvidence, ObservedEngine, QuizResult } from "@/lib/brain/schema";
import { ENGINE_LABELS } from "@/lib/brain/schema";
import { oneInEvery } from "@/lib/engine/mix";
import { ENGINE_ORDER } from "@/lib/plan/week";

/** Engines borrow region tints: how each one talks is where its material lives. */
export const ENGINE_TINT: Record<Engine, string> = {
  storyteller: "var(--color-lobe-stories)",
  commentator: "var(--color-lobe-opinions)",
  teacher: "var(--color-lobe-receipts)",
  documenter: "var(--color-lobe-personality)",
};

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const words = (n: number) => NUMBERS[n] ?? String(n);
const lower = (e: Engine) => ENGINE_LABELS[e].toLowerCase();

/** The answer text with its matched phrases in the engine's tint. */
function Quote({ evidence, tint }: { evidence: EngineEvidence; tint: string }) {
  const parts: { text: string; hit: boolean }[] = [];
  let at = 0;
  for (const [start, end] of evidence.matches) {
    if (start > at) parts.push({ text: evidence.text.slice(at, start), hit: false });
    parts.push({ text: evidence.text.slice(start, end), hit: true });
    at = end;
  }
  if (at < evidence.text.length) parts.push({ text: evidence.text.slice(at), hit: false });
  return (
    <p className="text-sm text-secondary">
      {parts.map((p, i) => (p.hit ? <span key={i} style={{ color: tint }}>{p.text}</span> : <span key={i}>{p.text}</span>))}
    </p>
  );
}

interface Props {
  quiz?: QuizResult;
  observed?: ObservedEngine;
  /** What the brain leads with now (observed, or the person's override). */
  primary: Engine;
  secondary?: Engine;
  onLeadWith: (engine: Engine) => void;
}

/** Four bars for what the answers showed, a tick on each for what the quiz said. */
export function EngineBars({ quiz, observed, primary, secondary, onLeadWith }: Props) {
  const [showEvidence, setShowEvidence] = useState(false);
  const blend = observed?.blend ?? quiz?.blend;
  if (!blend) return <p className="text-sm text-secondary">No engine yet. Take the quiz, then do the deep dive.</p>;

  const disagree = quiz && observed && quiz.primary !== observed.primary;
  const top = observed ? [...ENGINE_ORDER].sort((a, b) => observed.blend[b] - observed.blend[a]).slice(0, 2) : [];

  return (
    <div>
      <ul className="space-y-3">
        {ENGINE_ORDER.map((engine) => (
          <li key={engine} className="grid grid-cols-[110px_1fr_3ch] items-center gap-4 text-sm">
            <span className={engine === primary ? "text-ink" : "text-secondary"}>{ENGINE_LABELS[engine]}</span>
            <span className="relative block h-3">
              <span
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{ width: `${blend[engine]}%`, background: ENGINE_TINT[engine] }}
              />
              {quiz && (
                <span
                  aria-hidden
                  className="absolute -inset-y-1 w-0.5 bg-ink"
                  style={{ left: `calc(${quiz.blend[engine]}% - 1px)` }}
                  title={`Quiz: ${quiz.blend[engine]}%`}
                />
              )}
            </span>
            <span className="text-right tabular-nums text-secondary">{blend[engine]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-secondary" />
          What your answers showed
        </span>
        {quiz && (
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-3.5 w-0.5 bg-ink" />
            What the quiz said
          </span>
        )}
      </p>

      <p className="mt-6 max-w-[68ch]">
        {disagree && (
          <>
            You said {lower(quiz.primary)}. Your answers ran {top.map((e) => `${lower(e)} ${observed.blend[e]}`).join(" · ")}:{" "}
            {words(observed.sceneOpeners)} of {words(observed.answerCount)} opened with a scene.{" "}
          </>
        )}
        Lead with {lower(primary)}
        {secondary ? `, let ${lower(secondary)} support it, roughly one post in ${oneInEvery(blend, secondary)}.` : "."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm text-secondary">Lead with</span>
        {ENGINE_ORDER.map((engine) => {
          const chosen = engine === primary;
          return (
            <button
              key={engine}
              type="button"
              aria-pressed={chosen}
              onClick={() => onLeadWith(engine)}
              className={`inline-flex h-8 items-center rounded-btn border px-3 text-xs ${chosen ? "border-ink text-ink" : "border-hairline text-secondary hover:text-ink"}`}
            >
              {ENGINE_LABELS[engine]}
            </button>
          );
        })}
      </div>

      {observed && (
        <div className="mt-6">
          <button
            type="button"
            className="text-sm text-secondary underline underline-offset-2 hover:text-ink"
            aria-expanded={showEvidence}
            onClick={() => setShowEvidence((s) => !s)}
          >
            {showEvidence ? "Hide the evidence" : "Show the evidence"}
          </button>
          {showEvidence && (
            <ul className="mt-4 space-y-3">
              {observed.evidence[observed.primary].map((ev) => (
                <li key={ev.answerId} className="border-l border-hairline pl-3">
                  <Quote evidence={ev} tint={ENGINE_TINT[observed.primary]} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
