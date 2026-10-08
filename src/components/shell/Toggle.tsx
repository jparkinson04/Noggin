"use client";

/** A switch: a hairline track, the knob goes signal when on. */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors ${on ? "border-signal" : "border-hairline"}`}
    >
      <span className={`absolute h-4 w-4 rounded-full transition-[left] ${on ? "left-[21px] bg-signal" : "left-[3px] bg-secondary"}`} />
    </button>
  );
}
