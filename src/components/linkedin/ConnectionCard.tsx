"use client";

import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { formatDate } from "@/components/linkedin/when";
import { Button } from "@/components/shell/Button";
import { daysUntilExpiry, isConnectionExpired, isExpiringSoon } from "@/lib/linkedin/tokens";

/** Not connected / connected / expiring soon / expired, with the one right button for each. */
export function ConnectionCard() {
  const li = useLinkedIn();
  const c = li.connection;
  const expired = !!c && isConnectionExpired(c);
  const soon = !!c && isExpiringSoon(c);
  const days = c ? daysUntilExpiry(c) : 0;
  const mock = c?.linkedinMemberUrn.includes("mock");

  return (
    <section className="max-w-[60ch] border-t border-hairline pt-6">
      <h2 className="text-base">LinkedIn</h2>
      {!li.loaded ? (
        <p className="mt-2 text-sm text-secondary">Checking…</p>
      ) : !c ? (
        <>
          <p className="mt-2 text-sm text-secondary">
            Not connected. Connect once and Noggin can publish and schedule posts to your profile. Only the official API is used; nothing is scraped.
          </p>
          <Button className="mt-4" onClick={li.connect}>
            Connect LinkedIn
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-raised text-xs text-secondary">
              {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-10 w-10" /> : c.displayName.slice(0, 1)}
            </span>
            <span>
              <span className="block text-sm font-medium">{c.displayName}</span>
              <span className="block text-xs text-secondary">
                {expired
                  ? `Expired on ${formatDate(c.tokenExpiresAt)}`
                  : `Expires in ${days} day${days === 1 ? "" : "s"}, on ${formatDate(c.tokenExpiresAt)}`}
              </span>
            </span>
          </div>
          {(expired || soon) && (
            <p className="mt-4 text-sm">
              {expired
                ? "Scheduled posts won't go out until you reconnect."
                : "LinkedIn connections last 60 days and can't be renewed in the background. Reconnect before it runs out."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {expired || soon ? (
              <Button variant="primary" onClick={li.connect}>
                Reconnect
              </Button>
            ) : (
              <Button onClick={li.connect}>Reconnect</Button>
            )}
            <Button onClick={() => li.disconnect()}>Disconnect</Button>
          </div>
          {mock && (
            <p className="mt-6 text-xs text-secondary">
              Mock mode. Try the other states:{" "}
              <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => li.ageToken(5)}>
                expiring in 5 days
              </button>
              {" · "}
              <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => li.ageToken(-1)}>
                expired
              </button>
              {" · "}
              <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => li.ageToken(60)}>
                fresh
              </button>
            </p>
          )}
        </>
      )}
    </section>
  );
}
