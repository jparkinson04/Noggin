"use client";

import { useEffect, useState } from "react";
import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { StatusPill } from "@/components/linkedin/StatusPill";
import { formatWhen, fromLocalInput, toLocalInput } from "@/components/linkedin/when";
import { Button } from "@/components/shell/Button";
import { firstLine } from "@/lib/linkedin/format";
import type { ScheduledPost } from "@/lib/linkedin/types";

const LINK = "text-xs text-secondary underline underline-offset-2 hover:text-ink";

/** The queue, grouped. In mock mode the page runs the worker every 30 seconds so due posts go out. */
export function ScheduledQueue() {
  const li = useLinkedIn();

  useEffect(() => {
    const tick = () => li.runWorker().catch(() => {});
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = li.posts.filter((p) => p.status === "scheduled" || p.status === "publishing");
  const published = li.posts.filter((p) => p.status === "published").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const failed = li.posts.filter((p) => p.status === "failed");

  if (li.loaded && li.posts.filter((p) => p.status !== "cancelled").length === 0) {
    return (
      <p className="max-w-[60ch] text-sm text-secondary">
        Nothing in the queue. Finish a post in Studio and choose Schedule, and it will appear here.
      </p>
    );
  }

  return (
    <div className="max-w-[760px] space-y-10">
      <Group title="Upcoming" posts={upcoming} />
      <Group title="Published" posts={published} />
      <Group title="Failed" posts={failed} />
    </div>
  );
}

function Group({ title, posts }: { title: string; posts: ScheduledPost[] }) {
  return (
    <section>
      <h2 className="text-base">{title}</h2>
      {posts.length === 0 ? (
        <p className="mt-2 text-sm text-secondary">None.</p>
      ) : (
        <ul className="mt-3 border-b border-hairline">
          {posts.map((p) => (
            <Row key={p.id} post={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({ post }: { post: ScheduledPost }) {
  const li = useLinkedIn();
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(() => toLocalInput(new Date(post.scheduledFor)));
  const [note, setNote] = useState<string | null>(null);

  async function act(work: () => Promise<unknown>) {
    setNote(null);
    try {
      await work();
      setEditing(false);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const when_ = post.status === "published" && post.publishedAt ? post.publishedAt : post.scheduledFor;

  return (
    <li className="grid gap-3 border-t border-hairline py-4 md:grid-cols-[150px_1fr_auto] md:items-start">
      <span className="text-sm text-secondary tabular-nums">{formatWhen(when_)}</span>
      <div className="min-w-0">
        <p className="truncate text-sm">{firstLine(post.body) || <span className="text-muted">(empty)</span>}</p>
        {post.status === "failed" && post.errorMessage && (
          <p className="mt-1 text-xs text-secondary">
            {post.errorMessage}
            {post.attempts > 1 ? ` · ${post.attempts} attempts` : ""}
          </p>
        )}
        {note && <p className="mt-1 text-xs text-secondary">{note}</p>}
        {editing && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              value={when}
              min={toLocalInput(new Date())}
              onChange={(e) => setWhen(e.target.value)}
              className="rounded-sm border border-hairline bg-ground px-3 py-1.5 text-sm text-ink"
            />
            <Button size="small" variant="primary" onClick={() => act(() => li.reschedule(post.id, fromLocalInput(when)))}>
              Save time
            </Button>
            <Button size="small" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <StatusPill status={post.status} />
        <div className="flex flex-wrap gap-3">
          {post.status === "scheduled" && (
            <>
              <button type="button" className={LINK} onClick={() => setEditing((e) => !e)}>
                Edit time
              </button>
              <button type="button" className={LINK} onClick={() => act(() => li.publishQueued(post.id))}>
                Post now
              </button>
              <button type="button" className={LINK} onClick={() => act(() => li.cancel(post.id))}>
                Cancel
              </button>
            </>
          )}
          {post.status === "failed" && (
            <>
              <button type="button" className={LINK} onClick={() => act(() => li.retry(post.id))}>
                Retry
              </button>
              <button type="button" className={LINK} onClick={() => setEditing((e) => !e)}>
                Edit time
              </button>
              <button type="button" className={LINK} onClick={() => act(() => li.cancel(post.id))}>
                Cancel
              </button>
            </>
          )}
          {post.status === "published" && post.linkedinPostUrl && (
            <a href={post.linkedinPostUrl} target="_blank" rel="noreferrer" className={LINK}>
              View on LinkedIn
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
