"use client";

import Link from "next/link";
import { useSettings } from "@/components/settings/SettingsProvider";
import { SECTIONS } from "@/lib/settings/sections";
import { BillingSection, DataSection, LinkedInSection, NotificationsSection, ProfileSection, SharingSection, VoiceSection } from "@/components/settings/sections";

export function SettingsPage({ section }: { section: string }) {
  const { save, error, loaded } = useSettings();
  const body = {
    profile: <ProfileSection />,
    voice: <VoiceSection />,
    sharing: <SharingSection />,
    linkedin: <LinkedInSection />,
    notifications: <NotificationsSection />,
    billing: <BillingSection />,
    data: <DataSection />,
  }[section];

  return (
    <div className="grid gap-8 px-4 py-6 md:px-6 lg:grid-cols-[220px_760px] lg:gap-16 lg:pt-8">
      <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
        <h1 className="text-2xl">Settings</h1>
        <nav className="mt-6 -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0" aria-label="Settings sections">
          <ul className="flex gap-4 whitespace-nowrap lg:flex-col lg:gap-0 lg:whitespace-normal">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.id === "profile" ? "/settings" : `/settings/${s.id}`}
                  aria-current={s.id === section ? "page" : undefined}
                  className={`block py-1.5 text-sm ${s.id === section ? "text-ink" : "text-secondary hover:text-ink"}`}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className="min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl">{SECTIONS.find((s) => s.id === section)?.title}</h2>
          <span className="text-xs text-secondary" aria-live="polite">
            {save === "saving" ? "Saving…" : save === "saved" ? "Saved" : save === "error" ? <span className="text-ink">Couldn&apos;t save: {error}</span> : ""}
          </span>
        </div>
        <div className="mt-6">{loaded ? body : <p className="text-sm text-secondary">Loading…</p>}</div>
      </section>
    </div>
  );
}
