"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Profile, UserSettings } from "@/lib/settings/types";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

/**
 * useSettings(): the person's settings and profile, with optimistic, debounced autosave.
 * Each field change updates the screen at once, then saves 600ms after the last change.
 */
export type SaveState = "idle" | "saving" | "saved" | "error";

interface SettingsState {
  loaded: boolean;
  settings: UserSettings;
  profile: Profile | null;
  save: SaveState;
  error: string | null;
  update: (patch: Partial<UserSettings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

const EMPTY: UserSettings = { ...DEFAULT_SETTINGS, userId: "", updatedAt: "" };
const Ctx = createContext<SettingsState | null>(null);

export function useSettings(): SettingsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings needs a SettingsProvider");
  return ctx;
}

const DEBOUNCE = 600;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(EMPTY);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<{ settings: Partial<UserSettings>; profile: Partial<Profile> }>({ settings: {}, profile: {} });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/settings/profile").then((r) => r.json())])
      .then(([s, p]) => {
        setSettings(s.settings);
        setProfile(p.profile);
      })
      .catch(() => setError("Couldn't load your settings."))
      .finally(() => setLoaded(true));
  }, []);

  const flush = useCallback(async () => {
    const batch = pending.current;
    pending.current = { settings: {}, profile: {} };
    const jobs: Promise<Response>[] = [];
    if (Object.keys(batch.settings).length) {
      jobs.push(fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(batch.settings) }));
    }
    if (Object.keys(batch.profile).length) {
      jobs.push(fetch("/api/settings/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(batch.profile) }));
    }
    if (!jobs.length) return;
    setSave("saving");
    try {
      const results = await Promise.all(jobs);
      for (const r of results) {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Couldn't save.");
        }
        const data = (await r.json()) as { settings?: UserSettings; profile?: Profile };
        if (data.settings) setSettings((s) => ({ ...s, updatedAt: data.settings!.updatedAt }));
        if (data.profile) setProfile(data.profile);
      }
      setError(null);
      setSave("saved");
      if (settledTimer.current) clearTimeout(settledTimer.current);
      settledTimer.current = setTimeout(() => setSave("idle"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
      setSave("error");
    }
  }, []);

  const queue = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, DEBOUNCE);
  }, [flush]);

  const update = useCallback(
    (patch: Partial<UserSettings>) => {
      setSettings((s) => ({ ...s, ...patch }));
      pending.current.settings = { ...pending.current.settings, ...patch };
      queue();
    },
    [queue]
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((p) => (p ? { ...p, ...patch } : p));
      pending.current.profile = { ...pending.current.profile, ...patch };
      queue();
    },
    [queue]
  );

  const uploadAvatar = useCallback(async (file: File) => {
    setSave("saving");
    const form = new FormData();
    form.append("photo", file);
    const r = await fetch("/api/account/avatar", { method: "POST", body: form });
    const data = (await r.json()) as { profile?: Profile; error?: string };
    if (!r.ok || !data.profile) {
      setError(data.error ?? "Couldn't upload the photo.");
      setSave("error");
      return;
    }
    setProfile(data.profile);
    setSave("saved");
  }, []);

  const removeAvatar = useCallback(async () => {
    const r = await fetch("/api/account/avatar", { method: "DELETE" });
    const data = (await r.json()) as { profile?: Profile };
    if (data.profile) setProfile(data.profile);
  }, []);

  const value = useMemo<SettingsState>(
    () => ({ loaded, settings, profile, save, error, update, updateProfile, uploadAvatar, removeAvatar }),
    [loaded, settings, profile, save, error, update, updateProfile, uploadAvatar, removeAvatar]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
