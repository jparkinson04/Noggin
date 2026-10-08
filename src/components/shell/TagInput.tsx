"use client";

import { useState } from "react";

/** Tags as hairline chips. Enter or comma adds; suggestions are tappable. */
export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder,
  label,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...tags, t]);
  };
  const left = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-sm border border-hairline px-2 py-1.5 focus-within:border-secondary">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2 py-0.5 text-xs">
            {t}
            <button type="button" aria-label={`Remove ${t}`} className="text-secondary hover:text-ink" onClick={() => onChange(tags.filter((x) => x !== t))}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          aria-label={label}
          placeholder={tags.length ? "" : placeholder}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) {
              add(e.target.value);
              setDraft("");
            } else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          className="min-w-[8ch] flex-1 bg-transparent py-0.5 text-sm placeholder:text-muted focus-visible:outline-none"
        />
      </div>
      {left.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary">
          <span>Tap to add:</span>
          {left.map((s) => (
            <button key={s} type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => add(s)}>
              {s}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
