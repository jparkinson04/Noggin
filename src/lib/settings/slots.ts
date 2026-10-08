import type { PostingSlot } from "./types";

/** The next default posting slot after `now`, in local time, or null if none are set. */
export function nextPostingSlot(slots: PostingSlot[], now = new Date()): Date | null {
  if (!slots.length) return null;
  for (let ahead = 0; ahead < 8; ahead++) {
    const day = new Date(now);
    day.setDate(now.getDate() + ahead);
    const todays = slots.filter((s) => s.day === day.getDay());
    for (const slot of todays.sort((a, b) => a.time.localeCompare(b.time))) {
      const [h, m] = slot.time.split(":").map(Number);
      const at = new Date(day);
      at.setHours(h, m, 0, 0);
      if (at.getTime() > now.getTime()) return at;
    }
  }
  return null;
}
