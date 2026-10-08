"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LinkedInConnection, ScheduledPost } from "@/lib/linkedin/types";

/**
 * The browser's view of LinkedIn: the safe connection columns and the queue, fetched from the
 * API routes. Never sees a token. Actions re-fetch after they succeed.
 */
interface LinkedInState {
  loaded: boolean;
  connection: LinkedInConnection | null;
  posts: ScheduledPost[];
  refresh: () => Promise<void>;
  connect: () => void;
  disconnect: () => Promise<void>;
  schedule: (input: { body: string; scheduledFor: string; studioPostId?: string | null; approved: boolean }) => Promise<ScheduledPost>;
  publishNow: (input: { body: string; studioPostId?: string | null; approved: boolean }) => Promise<ScheduledPost>;
  publishQueued: (id: string) => Promise<ScheduledPost>;
  reschedule: (id: string, scheduledFor: string) => Promise<ScheduledPost>;
  cancel: (id: string) => Promise<ScheduledPost>;
  retry: (id: string) => Promise<ScheduledPost>;
  runWorker: () => Promise<void>;
  /** Mock mode only. */
  ageToken: (daysFromNow: number) => Promise<void>;
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

const Ctx = createContext<LinkedInState | null>(null);

export function useLinkedIn(): LinkedInState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLinkedIn needs a LinkedInProvider");
  return ctx;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export function LinkedInProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [connection, setConnection] = useState<LinkedInConnection | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const refresh = useCallback(async () => {
    const [c, p] = await Promise.all([
      call<{ connection: LinkedInConnection | null }>("/api/linkedin/connection"),
      call<{ posts: ScheduledPost[] }>("/api/linkedin/posts"),
    ]);
    setConnection(c.connection);
    setPosts(p.posts);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoaded(true));
  }, [refresh]);

  const after = useCallback(
    async <T,>(work: Promise<T>): Promise<T> => {
      const result = await work;
      await refresh();
      return result;
    },
    [refresh]
  );

  const value = useMemo<LinkedInState>(
    () => ({
      loaded,
      connection,
      posts,
      refresh,
      connect: () => {
        window.location.href = "/api/linkedin/connect";
      },
      disconnect: () => after(call("/api/linkedin/connection", { method: "DELETE" })).then(() => undefined),
      schedule: (input) =>
        after(
          call<{ post: ScheduledPost }>("/api/linkedin/posts", {
            method: "POST",
            body: JSON.stringify({ ...input, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          })
        ).then((r) => r.post),
      publishNow: (input) =>
        after(call<{ post: ScheduledPost }>("/api/linkedin/posts", { method: "POST", body: JSON.stringify({ ...input, now: true }) })).then((r) => r.post),
      publishQueued: (id) => after(call<{ post: ScheduledPost }>(`/api/linkedin/posts/${id}/publish`, { method: "POST" })).then((r) => r.post),
      reschedule: (id, scheduledFor) =>
        after(call<{ post: ScheduledPost }>(`/api/linkedin/posts/${id}`, { method: "PATCH", body: JSON.stringify({ scheduledFor }) })).then((r) => r.post),
      cancel: (id) => after(call<{ post: ScheduledPost }>(`/api/linkedin/posts/${id}`, { method: "DELETE" })).then((r) => r.post),
      retry: (id) => after(call<{ post: ScheduledPost }>(`/api/linkedin/posts/${id}/retry`, { method: "POST" })).then((r) => r.post),
      runWorker: () => after(call("/api/linkedin/worker")).then(() => undefined),
      ageToken: (daysFromNow) => after(call("/api/linkedin/connection", { method: "PATCH", body: JSON.stringify({ daysFromNow }) })).then(() => undefined),
      bannerDismissed,
      dismissBanner: () => setBannerDismissed(true),
    }),
    [loaded, connection, posts, refresh, after, bannerDismissed]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
