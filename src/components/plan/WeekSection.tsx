import type { Brain } from "@/lib/brain/schema";
import { ENGINE_LABELS, OUTCOME_LABELS } from "@/lib/brain/schema";
import { ENGINE_TINT } from "@/components/engine/EngineBars";
import { planWeek } from "@/lib/plan/week";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The week as rows: day, what the post serves, the engine and shape it leans on. */
export function WeekSection({ brain }: { brain: Brain }) {
  const blend = brain.observed?.blend ?? brain.quiz?.blend;
  if (!blend) return <p className="text-sm text-secondary">Your week appears once your engine is known.</p>;
  const plan = planWeek({ situation: brain.goal, cadencePerWeek: brain.cadencePerWeek, mix: brain.mix, blend });

  return (
    <div>
      <ul className="border-b border-hairline">
        {plan.slots.map((slot) => (
          <li key={slot.day} className="grid grid-cols-[110px_1fr_auto] items-baseline gap-4 border-t border-hairline py-3 text-sm">
            <span>{DAYS[slot.day]}</span>
            <span className="text-secondary">
              <span className="text-ink">{cap(OUTCOME_LABELS[slot.outcome])}</span> · a {slot.shape}
            </span>
            <span className="flex items-center gap-2 text-xs text-secondary">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: ENGINE_TINT[slot.engine] }} />
              {ENGINE_LABELS[slot.engine]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-secondary">
        Over a month: {plan.perMonth.top} visible, {plan.perMonth.middle} trustworthy, {plan.perMonth.bottom} credible.
      </p>
    </div>
  );
}
