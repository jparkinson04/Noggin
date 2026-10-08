"use client";

/** A row of hairline options, one chosen. Replaces radio groups. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const chosen = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={chosen}
            onClick={() => onChange(o.value)}
            title={o.hint}
            className={`inline-flex h-8 items-center rounded-btn border px-3 text-xs ${chosen ? "border-ink text-ink" : "border-hairline text-secondary hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
