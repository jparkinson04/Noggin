"use client";

import { useMemo, useState } from "react";
import { BrainMap } from "@/components/brain/BrainMap";
import { Button } from "@/components/shell/Button";
import { StageColumn } from "@/components/shell/StageColumn";
import { useBrain } from "@/components/brain/BrainStore";
import { PublishControl } from "@/components/linkedin/PublishControl";
import { StudioTabs } from "@/components/studio/StudioTabs";
import { useSettings } from "@/components/settings/SettingsProvider";
import { bannedIn } from "@/lib/settings/writingProfile";
import { shapeFor } from "@/lib/engine/quiz";
import { cardById, cardCounts, daysSinceLabel, laneUsage, regionHeat, thisWeek } from "@/lib/brain/heat";
import { detectFunnel, detectLanes, voiceCheck } from "@/lib/brain/detectTopics";
import { OUTCOME_LABELS, type Post, type RegionKey } from "@/lib/brain/schema";

/** Inert until the help actions are wired. All four work only from approved cards. */
const HELP = ["Tighten", "Opening lines", "Angles", "Questions"];

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function StudioEditor({ cardId }: { cardId?: string }) {
  // Phase 1: posts live in memory so "Mark as posted" updates heat immediately.
  const { brain, addPost } = useBrain();

  // Opened from a slot on Home: start from that card's words.
  const [draft, setDraft] = useState(() => (cardId ? cardById(brain, cardId)?.body ?? "" : ""));
  const [saved, setSaved] = useState<string | null>(null);

  const usage = useMemo(() => laneUsage(brain), [brain]);
  const heat = useMemo(() => regionHeat(brain, usage), [brain, usage]);
  const week = useMemo(() => thisWeek(brain, usage), [brain, usage]);
  // The shape leans on the blend: a 40% teacher gets a lesson roughly four weeks in ten.
  const blend = brain.observed?.blend ?? brain.quiz?.blend;
  const shape = blend ? shapeFor(blend, Math.floor(Date.now() / (7 * 86_400_000))) : null;

  const detected = useMemo(() => detectLanes(brain, draft), [brain, draft]);
  const funnel = useMemo(() => detectFunnel(draft, detected), [draft, detected]);
  const { settings } = useSettings();
  // LinkedIn clichés plus the phrases this person said they'd never use (and em dashes, if ruled out).
  const isms = useMemo(() => [...new Set([...voiceCheck(draft), ...bannedIn(draft, settings)])], [draft, settings]);

  const litRegions = useMemo(
    () => new Set<RegionKey>(detected.map((d) => d.card.regionKey)),
    [detected]
  );

  const quietLanes = usage
    .filter((u) => u.status === "quiet" || u.status === "unused")
    .map((u) => ({ usage: u, card: cardById(brain, u.cardId)! }))
    .sort((a, b) => (a.usage.lastPostedAt ?? "0").localeCompare(b.usage.lastPostedAt ?? "0"))
    .slice(0, 4);

  function markPosted() {
    if (!draft.trim()) return;
    const post: Post = {
      id: `p_${Date.now()}`,
      status: "posted",
      body: draft,
      funnelLevel: funnel,
      laneCardIds: detected.map((d) => d.card.id),
      postedAt: new Date().toISOString().slice(0, 10),
    };
    addPost(post);
    setDraft("");
    setSaved("Posted. Your brain has been updated.");
  }

  return (
    <StageColumn
      stage={
        <div className="flex min-h-full flex-col lg:pt-2">
          <StudioTabs />
          <p className="mt-6 text-sm text-secondary">
            This week{week ? ` · ${week.card.title} · ${cap(OUTCOME_LABELS[week.outcome])}` : ""}
            {shape ? ` · ${cap(shape)}` : ""}
          </p>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSaved(null);
            }}
            aria-label="Your draft"
            placeholder="Start with the scene. Where were you, who was there, what was said?"
            className="mt-6 w-full max-w-[68ch] flex-1 min-h-[420px] resize-none bg-transparent text-md leading-[1.65] placeholder:text-muted focus-visible:outline-none"
          />
          {isms.length > 0 && (
            <p className="mt-4 max-w-[68ch] text-sm">
              This doesn&apos;t sound like you: {isms.map((i) => `“${i}”`).join(", ")}. None of these
              appear in anything you&apos;ve said.
            </p>
          )}
          <footer className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => setSaved("Draft saved.")}>Save draft</Button>
            <Button variant="primary" disabled={!draft.trim()} onClick={markPosted}>
              Mark as posted
            </Button>
            {saved && <span className="text-sm text-secondary">{saved}</span>}
            <span className="ml-auto flex gap-5 text-sm">
              {HELP.map((label) => (
                <button key={label} type="button" className="text-secondary hover:text-ink">
                  {label}
                </button>
              ))}
            </span>
          </footer>
          {draft.trim() && (
            // Sign-off: the brain is approved and no constructed lines exist in the draft (there is no
            // per-post sign-off state yet; see docs/LINKEDIN_PUBLISHING.md).
            <PublishControl body={draft} studioPostId={null} approved={brain.deepDiveStatus === "approved"} />
          )}
        </div>
      }
      column={
        <div>
          <BrainMap heat={heat} anchors={cardCounts(brain)} highlight={litRegions} compact className="max-w-[320px]" />

          <h2 className="mt-8 text-base">Draws from</h2>
          {detected.length === 0 ? (
            <p className="mt-1 text-sm text-secondary">Nothing yet. Keep writing.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {detected.map((d) => (
                <li
                  key={d.card.id}
                  className="rounded-sm border border-hairline px-2 py-0.5 text-xs text-signal"
                  title={`Matched: ${d.matched.join(", ")}`}
                >
                  {d.card.title}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-secondary">
            Reads as <span className="text-ink">{OUTCOME_LABELS[funnel]}</span>
            {detected.length > 1 ? ". More than one lane in this post: check it still has one purpose." : "."}
          </p>

          <h2 className="mt-10 text-base">Gone quiet</h2>
          <ul className="mt-2">
            {quietLanes.map(({ card, usage: u }) => (
              <li key={card.id} className="border-t border-hairline">
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-4 py-3 text-left hover:text-signal"
                  onClick={() => setDraft((d) => (d ? d : card.body))}
                >
                  <span className="text-sm">{card.title}</span>
                  <span className="shrink-0 text-xs text-secondary">
                    {u.lastPostedAt ? daysSinceLabel(u.lastPostedAt).replace(/ ago$/, "") : "never posted"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
