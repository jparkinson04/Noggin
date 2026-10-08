import type { PostStatus } from "@/lib/linkedin/types";

const LABEL: Record<PostStatus, string> = {
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** A small hairline pill. Only the accent for the live states; failed reads in the Whys tint. */
export function StatusPill({ status }: { status: PostStatus }) {
  const tone =
    status === "published" || status === "publishing"
      ? "border-signal text-signal"
      : status === "failed"
        ? "text-ink"
        : "border-hairline text-secondary";
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs ${tone}`}
      style={status === "failed" ? { borderColor: "var(--color-lobe-whys)", color: "var(--color-lobe-whys)" } : undefined}
    >
      {LABEL[status]}
    </span>
  );
}
