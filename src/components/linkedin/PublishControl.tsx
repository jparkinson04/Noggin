"use client";

import { useState } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { formatDate, fromLocalInput, nextSlot, toLocalInput } from "@/components/linkedin/when";
import { Button } from "@/components/shell/Button";
import { isConnectionExpired, tokenCoversDate } from "@/lib/linkedin/tokens";
import { LINKEDIN_POST_LIMIT } from "@/lib/linkedin/types";

interface Props {
  body: string;
  studioPostId?: string | null;
  /** Studio's sign-off: the brain is approved and the draft carries no constructed lines. */
  approved: boolean;
  onPublished?: () => void;
}

/** Publish: post now, or schedule. Shown under a finished post in Studio. */
export function PublishControl({ body, studioPostId, approved, onPublished }: Props) {
  const { brain } = useBrain();
  const li = useLinkedIn();
  const [mode, setMode] = useState<"closed" | "schedule">("closed");
  const [when, setWhen] = useState(() => toLocalInput(nextSlot()));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const count = body.length;
  const over = count > LINKEDIN_POST_LIMIT;
  const connected = !!li.connection && !isConnectionExpired(li.connection);
  const expired = !!li.connection && isConnectionExpired(li.connection);
  const scheduledIso = when ? fromLocalInput(when) : null;
  const tokenShort = !!li.connection && scheduledIso !== null && !tokenCoversDate(li.connection, scheduledIso);
  const canSend = approved && connected && body.trim().length > 0 && !over && !busy;

  async function run(work: () => Promise<{ status?: string; errorMessage?: string | null }>, done: string) {
    setBusy(true);
    setNote(null);
    try {
      const result = await work();
      if (result.status === "failed") throw new Error(result.errorMessage ?? "LinkedIn didn't accept the post.");
      setNote(done);
      setMode("closed");
      onPublished?.();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 max-w-[68ch] border-t border-hairline pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base">Publish to LinkedIn</h2>
        <span className={`text-xs tabular-nums ${over ? "text-signal" : "text-secondary"}`}>
          {count.toLocaleString("en-GB")} / {LINKEDIN_POST_LIMIT.toLocaleString("en-GB")}
        </span>
      </div>

      {/* LinkedIn-style preview */}
      <div className="mt-4 rounded-md border border-hairline p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-xs text-secondary">
            {li.connection?.avatarUrl ? (
              <img src={li.connection.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              brain.ownerName.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()
            )}
          </span>
          <span>
            <span className="block text-sm font-medium">{li.connection?.displayName ?? brain.ownerName}</span>
            <span className="block text-xs text-secondary">{brain.headline.split(".")[0]}</span>
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{body.trim() || <span className="text-muted">Your post will appear here.</span>}</p>
      </div>

      {!approved && (
        <p className="mt-4 text-sm text-secondary">Only a post you&apos;ve signed off in Studio can be published.</p>
      )}

      {li.loaded && !li.connection && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-secondary">Connect LinkedIn to publish from here.</p>
          <Button size="small" onClick={li.connect}>
            Connect LinkedIn
          </Button>
        </div>
      )}
      {expired && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm">Your LinkedIn connection has expired.</p>
          <Button size="small" onClick={li.connect}>
            Reconnect
          </Button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={!canSend} onClick={() => run(() => li.publishNow({ body, studioPostId, approved }), "Posted to LinkedIn.")}>
          {busy ? "Posting…" : "Post now"}
        </Button>
        <Button disabled={!approved || !connected || over} aria-expanded={mode === "schedule"} onClick={() => setMode(mode === "schedule" ? "closed" : "schedule")}>
          Schedule
        </Button>
        {note && <span className="text-sm text-secondary">{note}</span>}
      </div>

      {mode === "schedule" && (
        <div className="mt-5 border-t border-hairline pt-5">
          <label className="block text-sm text-secondary">
            When, in your local time
            <input
              type="datetime-local"
              value={when}
              min={toLocalInput(new Date())}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-2 block rounded-sm border border-hairline bg-ground px-3 py-2 text-base text-ink"
            />
          </label>
          {tokenShort && li.connection && (
            <div className="mt-4 flex flex-wrap items-center gap-4 border-l-2 border-signal pl-3">
              <p className="text-sm">
                Your LinkedIn connection expires on {formatDate(li.connection.tokenExpiresAt)}. Reconnect before then or this post won&apos;t go out.
              </p>
              <Button size="small" onClick={li.connect}>
                Reconnect
              </Button>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <Button
              variant="primary"
              size="small"
              disabled={!canSend || !scheduledIso}
              onClick={() => run(() => li.schedule({ body, scheduledFor: scheduledIso!, studioPostId, approved }), "Scheduled. It's in your queue.")}
            >
              Add to queue
            </Button>
            <Button size="small" onClick={() => setMode("closed")}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
