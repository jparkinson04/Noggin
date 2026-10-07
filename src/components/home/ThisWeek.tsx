"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrain } from "@/components/brain/BrainStore";
import { ENGINE_TINT } from "@/components/engine/EngineBars";
import type { Brain, LaneUsage } from "@/lib/brain/schema";
import { OUTCOME_LABELS } from "@/lib/brain/schema";
import { planWeek, suggestForWeek } from "@/lib/plan/week";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COUNT = ["no", "one", "two", "three", "four", "five", "six", "seven"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The week's slots as rows. A posted slot shows a tick and dims. */
export function ThisWeek({
  brain,
  usage,
  postedSlots,
  inPanel = false,
}: {
  brain: Brain;
  usage: LaneUsage[];
  postedSlots: Record<number, string>;
  /** Inside a Home panel the panel carries the heading and the link. */
  inPanel?: boolean;
}) {
  const router = useRouter();
  const { openSlot } = useBrain();
  const blend = brain.observed?.blend ?? brain.quiz?.blend;
  if (!blend) return null;
  const plan = planWeek({ situation: brain.goal, cadencePerWeek: brain.cadencePerWeek, mix: brain.mix, blend });
  const slots = suggestForWeek(plan, brain, usage);
  const posted = slots.filter((s) => postedSlots[s.day]).length;

  return (
    <section>
      {!inPanel && <h2 className="text-[1.375rem]">This week</h2>}
      <p className={`text-sm text-secondary ${inPanel ? "" : "mt-1"}`}>
        {cap(COUNT[slots.length] ?? String(slots.length))} post{slots.length === 1 ? "" : "s"}.{" "}
        {cap(slots.map((s) => OUTCOME_LABELS[s.outcome]).join(", "))}.
      </p>
      <ul className="mt-4 border-b border-hairline">
        {slots.map((slot) => {
          const done = !!postedSlots[slot.day];
          return (
            <li key={slot.day} className="border-t border-hairline">
              <button
                type="button"
                disabled={!slot.card}
                onClick={() => {
                  openSlot(slot.day);
                  router.push(`/studio?card=${slot.card!.id}`);
                }}
                className={`grid w-full grid-cols-[56px_1fr] gap-x-2 py-3 text-left ${done ? "opacity-45" : "hover:text-signal"}`}
              >
                <span className="text-sm text-secondary" aria-label={done ? `${DAYS[slot.day]}, posted` : DAYS[slot.day]}>
                  {done ? "✓" : DAYS[slot.day]}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm">
                    <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: ENGINE_TINT[slot.engine] }} />
                    <span className="text-ink">{cap(OUTCOME_LABELS[slot.outcome])}</span>
                    <span className="text-secondary">· a {slot.shape}</span>
                  </span>
                  {slot.card ? (
                    <span className="mt-1 block text-sm">
                      <span className="text-ink">{slot.card.title}</span>
                      {slot.reason && <span className="block text-secondary">{slot.reason}</span>}
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm text-secondary">Nothing in your brain fits this one yet.</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-secondary">
        Posted {posted} of {slots.length} this week
        {!inPanel && (
          <>
            {" "}·{" "}
            <Link href="/brain/board#week" className="underline underline-offset-2 hover:text-ink">
              Change my week
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
