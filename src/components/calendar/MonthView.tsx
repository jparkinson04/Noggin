"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import { Button } from "@/components/shell/Button";
import { firstLine } from "@/lib/linkedin/format";
import type { PostStatus } from "@/lib/linkedin/types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LINK = "text-xs text-secondary underline underline-offset-2 hover:text-ink";

/** One thing on one day: a queued or published LinkedIn post, a post marked as posted in Studio, or an event. */
interface Entry {
  key: string;
  kind: "queued" | "posted" | "event";
  status?: PostStatus;
  time?: string;
  text: string;
  href?: string;
}

const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** The month, one cell per day, with what's planned, posted and in the diary. */
export function MonthView() {
  const { brain, addEvent, removeEvent } = useBrain();
  const li = useLinkedIn();
  const { settings } = useSettings();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [adding, setAdding] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  // Everything, keyed by local date.
  const entries = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const push = (date: string, e: Entry) => map.set(date, [...(map.get(date) ?? []), e]);
    for (const p of li.posts) {
      if (p.status === "cancelled") continue;
      const when = p.status === "published" && p.publishedAt ? p.publishedAt : p.scheduledFor;
      push(localDate(new Date(when)), { key: `li-${p.id}`, kind: "queued", status: p.status, time: timeOf(when), text: firstLine(p.body, 60), href: "/studio/scheduled" });
    }
    for (const p of brain.posts) {
      if (p.status === "posted" && p.postedAt) push(p.postedAt, { key: `post-${p.id}`, kind: "posted", text: firstLine(p.body, 60) });
    }
    for (const e of brain.events) push(e.date, { key: `ev-${e.date}-${e.title}`, kind: "event", text: e.title });
    for (const list of map.values()) list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    return map;
  }, [li.posts, brain.posts, brain.events]);

  const slotDays = new Set(settings.postingSlots.map((s) => s.day));
  const slotTime = (day: number) => settings.postingSlots.find((s) => s.day === day)?.time;

  // Grid: Monday first, padded to full weeks.
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const queuedThisMonth = li.posts.filter((p) => p.status === "scheduled" && new Date(p.scheduledFor).getMonth() === cursor.getMonth() && new Date(p.scheduledFor).getFullYear() === cursor.getFullYear()).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl">{monthLabel}</h1>
          <span className="text-sm text-secondary">
            {queuedThisMonth} scheduled
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month">
            Previous
          </Button>
          <Button size="small" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Button>
          <Button size="small" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month">
            Next
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 border-l border-t border-hairline">
        {DAY_NAMES.map((d) => (
          <div key={d} className="border-b border-r border-hairline px-2 py-1.5 text-xs text-secondary">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className="min-h-[96px] border-b border-r border-hairline" />;
          const key = localDate(date);
          const list = entries.get(key) ?? [];
          const isToday = key === localDate(today);
          const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const slot = !list.some((e) => e.kind === "queued") && !past && slotDays.has(date.getDay());
          return (
            <div key={key} className={`group relative min-h-[96px] border-b border-r border-hairline p-2 ${past ? "text-secondary" : ""}`}>
              <div className="flex items-baseline justify-between">
                <span className={`text-xs ${isToday ? "rounded-full bg-ink px-1.5 text-ground" : ""}`}>{date.getDate()}</span>
                <button type="button" className="text-xs text-muted opacity-0 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Add an event on ${date.getDate()}`} onClick={() => { setAdding(key); setTitle(""); }}>
                  +
                </button>
              </div>
              <ul className="mt-1.5 space-y-1">
                {list.map((e) => (
                  <li key={e.key} className="flex items-start gap-1.5 text-xs leading-snug">
                    <span
                      aria-hidden
                      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.kind === "event" ? "border border-secondary" : e.status === "failed" ? "" : e.status === "scheduled" || e.status === "publishing" ? "bg-signal" : "bg-secondary"}`}
                      style={e.status === "failed" ? { background: "var(--color-lobe-whys)" } : undefined}
                    />
                    {e.href ? (
                      <Link href={e.href} className="min-w-0 truncate hover:text-signal" title={e.text}>
                        {e.time && <span className="text-secondary">{e.time} </span>}
                        {e.text}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate" title={e.text}>
                        {e.text}
                        {e.kind === "event" && (
                          <button type="button" className="ml-1 text-muted hover:text-ink" aria-label={`Remove ${e.text}`} onClick={() => removeEvent(key, e.text)}>
                            ×
                          </button>
                        )}
                      </span>
                    )}
                  </li>
                ))}
                {slot && (
                  <li className="text-xs text-muted">
                    <Link href="/studio" className="hover:text-ink">
                      {slotTime(date.getDay())} slot free
                    </Link>
                  </li>
                )}
              </ul>
              {adding === key && (
                <form
                  className="mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (title.trim()) addEvent({ date: key, title: title.trim() });
                    setAdding(null);
                  }}
                >
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !title.trim() && setAdding(null)} placeholder="Event" aria-label="Event title" className="w-full rounded-sm border border-hairline bg-ground px-1.5 py-1 text-xs focus-visible:outline-none" />
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-secondary">
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />Scheduled for LinkedIn</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-secondary" />Posted</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-lobe-whys)" }} />Failed</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full border border-secondary" />Event</span>
        <Link href="/studio/scheduled" className={LINK}>Open the queue</Link>
        <Link href="/settings/linkedin" className={LINK}>Change posting slots</Link>
      </p>
    </div>
  );
}
