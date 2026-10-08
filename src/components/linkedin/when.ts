/** Date helpers for the publishing UI: local display, UTC storage. */

/** "Thu 15 Oct, 09:30" in the viewer's zone. */
export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "15 Oct 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The value a <input type="datetime-local"> wants, in local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value, read as local time, to UTC ISO. */
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

/** A sensible default: the next whole hour, at least an hour away. */
export function nextSlot(now = new Date()): Date {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}
