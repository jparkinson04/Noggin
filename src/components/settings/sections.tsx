"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrain } from "@/components/brain/BrainStore";
import { ConnectionCard } from "@/components/linkedin/ConnectionCard";
import { useLinkedIn } from "@/components/linkedin/LinkedInProvider";
import { Field, INPUT, SELECT } from "@/components/settings/Field";
import { useSettings } from "@/components/settings/SettingsProvider";
import { Button } from "@/components/shell/Button";
import { Segmented } from "@/components/shell/Segmented";
import { TagInput } from "@/components/shell/TagInput";
import { Toggle } from "@/components/shell/Toggle";
import { getBillingSummary, type BillingSummary } from "@/lib/settings/billing";
import { SHARING_TOPICS, SUGGESTED_BANNED, type NotificationKey, type PostingSlot, type SharingChoice } from "@/lib/settings/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LINK = "text-sm text-secondary underline underline-offset-2 hover:text-ink";

/* ---------- Profile ---------- */

/** A text input that saves on blur. */
function BlurInput({ value, onSave, ...rest }: { value: string; onSave: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input {...rest} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== value && onSave(draft.trim())} className={INPUT} />;
}

export function ProfileSection() {
  const { profile, updateProfile, uploadAvatar, removeAvatar, settings, update } = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const zones = useMemo(() => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Europe/London"]), []);

  async function post(url: string, body: object) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await r.json()) as { message?: string; error?: string };
    setNote(data.message ?? data.error ?? null);
  }

  if (!profile) return <p className="text-sm text-secondary">Loading…</p>;
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <Field label="Photo">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-raised text-sm text-secondary">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-16 w-16 object-cover" /> : initials}
          </span>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          <Button size="small" onClick={() => file.current?.click()}>
            {profile.avatarUrl ? "Change photo" : "Add a photo"}
          </Button>
          {profile.avatarUrl && (
            <button type="button" className={LINK} onClick={removeAvatar}>
              Remove
            </button>
          )}
        </div>
      </Field>
      <Field label="First name">
        <BlurInput value={profile.firstName} onSave={(v) => updateProfile({ firstName: v })} aria-label="First name" />
      </Field>
      <Field label="Last name">
        <BlurInput value={profile.lastName} onSave={(v) => updateProfile({ lastName: v })} aria-label="Last name" />
      </Field>
      <Field label="Job title">
        <BlurInput value={profile.jobTitle} onSave={(v) => updateProfile({ jobTitle: v })} aria-label="Job title" />
      </Field>
      <Field label="Company">
        <BlurInput value={profile.company} onSave={(v) => updateProfile({ company: v })} aria-label="Company" />
      </Field>
      <Field label="Email">
        <p className="text-sm">{profile.email}</p>
        {emailOpen ? (
          <form
            className="mt-3 flex flex-wrap items-center gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email") as string;
              await post("/api/account/email", { email });
              setEmailOpen(false);
            }}
          >
            <input name="email" type="email" required placeholder="New email address" className={INPUT} />
            <Button size="small" variant="primary" type="submit">
              Send confirmation
            </Button>
            <Button size="small" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <button type="button" className={`${LINK} mt-2`} onClick={() => setEmailOpen(true)}>
            Change email
          </button>
        )}
      </Field>
      <Field label="Password">
        {profile.oauthProvider ? (
          <p className="text-sm text-secondary">Signed in with {profile.oauthProvider}</p>
        ) : pwOpen ? (
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const password = new FormData(e.currentTarget).get("password") as string;
              await post("/api/account/password", { password });
              setPwOpen(false);
            }}
          >
            <input name="password" type="password" required minLength={8} placeholder="New password" className={INPUT} />
            <Button size="small" variant="primary" type="submit">
              Save password
            </Button>
            <Button size="small" onClick={() => setPwOpen(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <button type="button" className={LINK} onClick={() => setPwOpen(true)}>
            Change password
          </button>
        )}
        {note && <p className="mt-2 text-xs text-secondary">{note}</p>}
      </Field>
      <Field label="Timezone" help="Used for scheduling posts and timing your reminders.">
        <input
          list="timezones"
          aria-label="Timezone"
          defaultValue={settings.timezone}
          onBlur={(e) => zones.includes(e.target.value) && e.target.value !== settings.timezone && update({ timezone: e.target.value })}
          className={INPUT}
        />
        <datalist id="timezones">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </Field>
    </div>
  );
}

/* ---------- Your voice ---------- */

export function VoiceSection() {
  const { settings, update } = useSettings();
  return (
    <div>
      <p className="mb-2 text-sm text-secondary">Your stories and opinions live in your Board. This is how you like them written.</p>
      <Field label="Spelling">
        <Segmented label="Spelling" value={settings.spelling} onChange={(v) => update({ spelling: v })} options={[{ value: "uk", label: "UK English" }, { value: "us", label: "US English" }]} />
      </Field>
      <Field label="Words and phrases you'd never use" help="Studio flags these in a draft and never suggests them." stack>
        <TagInput label="Banned phrases" tags={settings.bannedPhrases} onChange={(t) => update({ bannedPhrases: t })} suggestions={SUGGESTED_BANNED} placeholder="Type a phrase and press enter" />
        <div className="mt-4 flex items-center gap-3">
          <Toggle label="No em dashes" on={settings.noEmDashes} onChange={(on) => update({ noEmDashes: on })} />
          <span className="text-sm">No em dashes</span>
        </div>
      </Field>
      <Field label="Phrases that sound like you" help="Things you actually say. Studio can reuse them." stack>
        <TagInput label="Signature phrases" tags={settings.signaturePhrases} onChange={(t) => update({ signaturePhrases: t })} placeholder="You're allowed to want something else" />
      </Field>
      <Field label="Emoji">
        <Segmented label="Emoji" value={settings.emojiLevel} onChange={(v) => update({ emojiLevel: v })} options={[{ value: "none", label: "None" }, { value: "sparingly", label: "Sparingly" }, { value: "happy", label: "Happy to use them" }]} />
      </Field>
      <Field label="Hashtags">
        <Segmented label="Hashtags" value={settings.hashtagLevel} onChange={(v) => update({ hashtagLevel: v })} options={[{ value: "none", label: "None" }, { value: "up_to_3", label: "Up to 3" }]} />
      </Field>
      <Field label="Default post length">
        <Segmented
          label="Default post length"
          value={settings.defaultPostLength}
          onChange={(v) => update({ defaultPostLength: v })}
          options={[
            { value: "short", label: "Short", hint: "Under about 600 characters" },
            { value: "medium", label: "Medium" },
            { value: "long", label: "Long", hint: "Up to 3,000 characters" },
          ]}
        />
      </Field>
    </div>
  );
}

/* ---------- Sharing ---------- */

const CHOICES: { value: SharingChoice; label: string }[] = [
  { value: "share", label: "Happy to share" },
  { value: "ask", label: "Ask me first" },
  { value: "never", label: "Never" },
];

export function SharingSection() {
  const { settings, update } = useSettings();
  const [custom, setCustom] = useState("");
  const customKeys = Object.keys(settings.sharing).filter((k) => !SHARING_TOPICS.some((t) => t.key === k));
  const set = (key: string, value: SharingChoice) => update({ sharing: { ...settings.sharing, [key]: value } });

  return (
    <div>
      <p className="mb-2 text-sm text-secondary">Noggin only suggests stories in areas you&apos;re comfortable with. You can change this any time.</p>
      {SHARING_TOPICS.map((t) => (
        <Field key={t.key} label={t.label}>
          <Segmented label={t.label} value={settings.sharing[t.key] ?? "ask"} onChange={(v) => set(t.key, v)} options={CHOICES} />
        </Field>
      ))}
      {customKeys.map((key) => (
        <Field key={key} label={key}>
          <div className="flex flex-wrap items-center gap-4">
            <Segmented label={key} value={settings.sharing[key]} onChange={(v) => set(key, v)} options={CHOICES} />
            <button
              type="button"
              className={LINK}
              onClick={() => {
                const next = { ...settings.sharing };
                delete next[key];
                update({ sharing: next });
              }}
            >
              Remove
            </button>
          </div>
        </Field>
      ))}
      <Field label="Add your own topic">
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const key = custom.trim();
            if (key && !settings.sharing[key]) set(key, "ask");
            setCustom("");
          }}
        >
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. My divorce" aria-label="New topic" className={INPUT} />
          <Button size="small" type="submit" disabled={!custom.trim()}>
            Add topic
          </Button>
        </form>
      </Field>
      <Field label="When a post mentions other people" help="The privacy pass. Anything about another person is off the board by default.">
        <Segmented label="Other people" value={settings.anonymiseOthers} onChange={(v) => update({ anonymiseOthers: v })} options={[{ value: "always", label: "Always anonymise" }, { value: "ask", label: "Ask me each time" }]} />
      </Field>
    </div>
  );
}

/* ---------- LinkedIn & publishing ---------- */

export function LinkedInSection() {
  const { settings, update } = useSettings();
  const slots = settings.postingSlots;
  const setSlots = (next: PostingSlot[]) => update({ postingSlots: [...next].sort((a, b) => a.day - b.day) });
  const has = (day: number) => slots.find((s) => s.day === day);

  return (
    <div>
      <ConnectionCard />
      <div className="mt-10">
        <Field label="Default posting slots" help="Pick the days you post and a time for each. Studio's schedule picker starts from the next one." stack>
          <ul className="space-y-2">
            {DAYS.map((name, day) => {
              const slot = has(day);
              return (
                <li key={day} className="flex items-center gap-4">
                  <Toggle label={name} on={!!slot} onChange={(on) => setSlots(on ? [...slots, { day, time: "09:30" }] : slots.filter((s) => s.day !== day))} />
                  <span className="w-10 text-sm">{name}</span>
                  {slot && (
                    <input
                      type="time"
                      value={slot.time}
                      aria-label={`${name} time`}
                      onChange={(e) => setSlots(slots.map((s) => (s.day === day ? { ...s, time: e.target.value } : s)))}
                      className={SELECT}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </Field>
        <Field label="Posting goal" help="Posts a week. Home shows your progress against it.">
          <select value={settings.weeklyPostGoal} onChange={(e) => update({ weeklyPostGoal: Number(e.target.value) })} aria-label="Posts per week" className={SELECT}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} a week
              </option>
            ))}
          </select>
        </Field>
        <Field label="Confirm before anything publishes" help="Studio asks once more before a post goes to LinkedIn.">
          <Toggle label="Confirm before anything publishes" on={settings.confirmBeforePublish} onChange={(on) => update({ confirmBeforePublish: on })} />
        </Field>
      </div>
    </div>
  );
}

/* ---------- Notifications ---------- */

const NOTIFICATIONS: { key: NotificationKey; label: string }[] = [
  { key: "topUp", label: "Weekly top-up questions" },
  { key: "digest", label: "Fortnightly Insights digest" },
  { key: "postPublished", label: "Post published" },
  { key: "postFailed", label: "Post failed to publish" },
  { key: "connectionExpiring", label: "LinkedIn connection expiring" },
  { key: "nudge", label: "Nudge if I haven't posted in a while" },
];

export function NotificationsSection() {
  const { settings, update } = useSettings();
  const n = settings.notifications;
  const set = (key: NotificationKey, channel: "email" | "inApp", on: boolean) =>
    update({ notifications: { ...n, [key]: { ...n[key], [channel]: on } } });

  // TODO(dev): the email service (Resend) reads user_settings.notifications before sending anything;
  // in-app reads it when building the Needs-you rows and the digest.
  return (
    <div>
      <div className="grid grid-cols-[1fr_64px_64px] gap-4 pb-2 text-xs text-secondary">
        <span />
        <span>Email</span>
        <span>In-app</span>
      </div>
      {NOTIFICATIONS.map((row) => (
        <div key={row.key} className="grid grid-cols-[1fr_64px_64px] items-center gap-4 border-t border-hairline py-4">
          <div>
            <p className="text-sm">{row.label}</p>
            {row.key === "digest" && <p className="text-xs text-secondary">Opt in. Off until you switch it on.</p>}
            {row.key === "nudge" && (
              <label className="mt-2 block text-xs text-secondary">
                After{" "}
                <select value={n.nudgeAfterDays} onChange={(e) => update({ notifications: { ...n, nudgeAfterDays: Number(e.target.value) as 7 | 14 | 30 } })} className={`${SELECT} ml-1 py-1`}>
                  {[7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <Toggle label={`${row.label} by email`} on={n[row.key].email} onChange={(on) => set(row.key, "email", on)} />
          <Toggle label={`${row.label} in app`} on={n[row.key].inApp} onChange={(on) => set(row.key, "inApp", on)} />
        </div>
      ))}
    </div>
  );
}

/* ---------- Plan & billing ---------- */

export function BillingSection() {
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  useEffect(() => {
    getBillingSummary("me").then(setBilling);
  }, []);
  if (!billing) return <p className="text-sm text-secondary">Loading…</p>;
  const price = `£${(billing.pricePence / 100).toFixed(0)} a ${billing.interval}`;
  return (
    <div>
      <div className="rounded-md border border-hairline bg-raised p-6">
        <p className="text-xs text-secondary">Current plan</p>
        <p className="display mt-1 text-2xl">{billing.planName}</p>
        <p className="mt-1 text-sm text-secondary">
          {price} · renews {new Date(billing.renewsOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          {billing.cardLast4 ? ` · card ending ${billing.cardLast4}` : ""}
        </p>
      </div>
      {billing.plan === "team" && (
        <p className="mt-4 text-sm">
          <Link href="/team" className={LINK}>
            Manage your team
          </Link>
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="small" disabled title="Coming soon">
          Change plan
        </Button>
        <Button size="small" disabled title="Coming soon">
          Update payment method
        </Button>
        <Button size="small" disabled title="Coming soon">
          View invoices
        </Button>
      </div>
      <p className="mt-3 text-xs text-secondary">Coming soon. Billing is being set up.</p>
    </div>
  );
}

/* ---------- Data & privacy ---------- */

export function DataSection() {
  const { settings, update, profile } = useSettings();
  const { brain, dumps } = useBrain();
  const li = useLinkedIn();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function download() {
    // Everything that is theirs, from the stores the browser already holds. Tokens are never in here.
    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      brain,
      brainDumps: dumps,
      linkedin: { connection: li.connection, scheduledPosts: li.posts },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noggin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm }) });
    const data = (await r.json()) as { error?: string };
    setNote(data.error ?? "Deleted.");
    setDeleting(false);
    setConfirm("");
  }

  return (
    <div>
      <Field label="Download my data" help="One JSON file: your profile, brain, board, posts, captures and settings.">
        <Button size="small" onClick={download}>
          Download my data
        </Button>
      </Field>
      <Field label="Voice recordings" help="Transcripts are always kept; this is about the audio.">
        {/* TODO(dev): the transcription job reads user_settings.keep_voice_recordings and removes the
            Storage object after a successful transcript when this is "delete". */}
        <Segmented label="Voice recordings" value={settings.keepVoiceRecordings ? "keep" : "delete"} onChange={(v) => update({ keepVoiceRecordings: v === "keep" })} options={[{ value: "keep", label: "Keep recordings" }, { value: "delete", label: "Delete after transcription" }]} />
      </Field>
      <Field label="How Noggin uses your data" stack>
        <div className="max-w-[60ch] space-y-3 text-sm text-secondary">
          <p>[COPY TO CONFIRM] Your answers, captures and posts are stored so Noggin can build and keep your brain. They are only ever shown to you.</p>
          <p>[COPY TO CONFIRM] When Noggin suggests or tightens something, the relevant cards are sent to an AI service to produce that one result. We are confirming with the provider how that data is handled and will state it plainly here.</p>
          <p>[COPY TO CONFIRM] Nothing is posted to LinkedIn unless you press the button, and Noggin only ever uses LinkedIn&apos;s official API.</p>
          <p>[COPY TO CONFIRM] You can download everything above, or delete your account and everything with it, at any time.</p>
        </div>
      </Field>
      <Field label="Delete account" help="Deletes your brain, posts, recordings and settings. This can't be undone.">
        <Button size="small" onClick={() => setDeleting(true)} style={{ borderColor: "var(--color-lobe-whys)", color: "var(--color-lobe-whys)" }}>
          Delete my account
        </Button>
        {note && <p className="mt-2 text-xs text-secondary">{note}</p>}
      </Field>

      {deleting && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 px-4" onClick={() => setDeleting(false)}>
          <div className="w-full max-w-md rounded-lg border border-hairline bg-ground p-8" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-title" className="text-xl">
              Delete your account?
            </h2>
            <p className="mt-2 text-sm text-secondary">Everything goes: your brain, board, posts, recordings and settings. Type <span className="text-ink">delete</span> to confirm.</p>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type delete to confirm" className={`${INPUT} mt-4`} autoFocus />
            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setDeleting(false)}>Keep my account</Button>
              <Button variant="primary" disabled={confirm !== "delete"} onClick={deleteAccount}>
                Delete everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
