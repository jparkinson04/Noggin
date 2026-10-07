import type { ReactNode } from "react";
import type { QuizResult } from "@/lib/brain/schema";
import { ENGINES, ENGINE_LABELS, OUTCOME_LABELS } from "@/lib/brain/schema";
import { ENGINE_COPY } from "@/lib/engine/quiz";
import { mixFor, oneInEvery } from "@/lib/engine/mix";

/** The quiz result, top to bottom. The button at the end is the caller's. */
export function EngineResult({ result, action }: { result: QuizResult; action: ReactNode }) {
  const { blend, primary, secondary, situation, mix, cadencePerWeek, quizFlag } = result;
  const rule = mixFor(situation);
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  // The dot bar: primary in the accent, the rest in three descending greys, in blend order.
  const order = [...ENGINES].sort((a, b) => blend[b] - blend[a]);
  const shade = ["bg-signal", "bg-ink", "bg-secondary", "bg-muted"];
  const dots = order.flatMap((engine, rank) => Array.from({ length: blend[engine] }, () => shade[rank]));

  return (
    <div>
      <p className="text-xs text-secondary">Your primary engine</p>
      <h1 className="mt-2 text-5xl md:text-[6rem] md:leading-none">{ENGINE_LABELS[primary]}</h1>
      <p className="mt-6 text-secondary">
        Your blend: {ENGINES.map((e) => `${ENGINE_LABELS[e]} ${blend[e]}`).join(" · ")}
      </p>

      <div className="mt-8 max-w-[68ch] space-y-4">
        {ENGINE_COPY[primary].map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>

      {secondary && (
        <p className="mt-6 max-w-[68ch]">
          Your second engine is {ENGINE_LABELS[secondary]}. Let it support the first rather than compete with
          it, roughly one post in {oneInEvery(blend, secondary)}.
        </p>
      )}

      {quizFlag && (
        <section className="mt-10 border-y border-hairline py-6">
          <h2 className="text-lg">One thing worth flagging</h2>
          <p className="mt-2 max-w-[68ch]">{quizFlag}</p>
        </section>
      )}

      <div className="mt-10">
        <div className="flex flex-wrap gap-[5px]" aria-hidden>
          {dots.map((cls, i) => (
            <span key={i} className={`h-[7px] w-[7px] rounded-full ${cls}`} />
          ))}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-secondary">
          {order.map((engine, rank) => (
            <span key={engine} className={rank === 0 ? "text-ink" : undefined}>
              {ENGINE_LABELS[engine]} {blend[engine]}%
            </span>
          ))}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-lg">Your mix</h2>
        <ul className="mt-3 border-b border-hairline">
          {(["top", "middle", "bottom"] as const).map((level) => (
            <li key={level} className="flex items-baseline gap-6 border-t border-hairline py-4">
              <span className="w-32 shrink-0">
                {cap(OUTCOME_LABELS[level])} <span className="text-secondary">{mix[level]}%</span>
              </span>
              <span className="text-sm text-secondary">{rule.reasons[level]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">{cadencePerWeek} posts a week</p>
      </section>

      <div className="mt-12">{action}</div>
    </div>
  );
}
