"use client";

import Link from "next/link";
import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { formatDate } from "@/components/linkedin/when";
import { daysUntilExpiry, isConnectionExpired, isExpiringSoon, tokenCoversDate } from "@/lib/linkedin/tokens";

/** One line across the top when the connection is expiring or expired and scheduled posts will be hit. */
export function ExpiryBanner() {
  const li = useLinkedIn();
  const c = li.connection;
  if (!c || li.bannerDismissed) return null;
  const expired = isConnectionExpired(c);
  const soon = isExpiringSoon(c);
  if (!expired && !soon) return null;
  const affected = li.posts.filter((p) => p.status === "scheduled" && (expired || !tokenCoversDate(c, p.scheduledFor)));
  if (affected.length === 0) return null;

  const n = affected.length;
  const text = expired
    ? `Your LinkedIn connection expired on ${formatDate(c.tokenExpiresAt)}. ${n} scheduled post${n === 1 ? "" : "s"} won't go out until you reconnect.`
    : `Your LinkedIn connection expires in ${daysUntilExpiry(c)} days. ${n} scheduled post${n === 1 ? " is" : "s are"} due after that.`;

  return (
    <div className="flex items-center gap-4 border-b border-hairline px-4 py-2.5 text-sm md:px-6">
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-signal" />
      <p className="min-w-0 flex-1">
        {text}{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-signal">
          Reconnect
        </Link>
      </p>
      <button type="button" className="text-xs text-secondary hover:text-ink" onClick={li.dismissBanner} aria-label="Dismiss">
        Dismiss
      </button>
    </div>
  );
}
