"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { BrainMap } from "@/components/brain/BrainMap";
import { useBrain } from "@/components/brain/BrainStore";
import { useCapture } from "@/components/capture/CaptureSheet";
import { Panel } from "@/components/home/Panel";
import { ThisWeek } from "@/components/home/ThisWeek";
import { Button } from "@/components/shell/Button";
import { MicIcon } from "@/components/shell/MicIcon";
import { laneUsage, mappedShare, quietAfterDays, regionHeat } from "@/lib/brain/heat";
import { TOP_UP_QUESTIONS } from "@/lib/brain/questions";
import { OUTCOME_LABELS, REGION_LABELS, type FunnelLevel } from "@/lib/brain/schema";
import { actualMix30d, capturesThisMonth, daysSinceLastPost, longestRunWeeks, postsLastFourWeeks, regionsQuiet } from "@/lib/brain/stats";
import { SHAPE_FOR } from "@/lib/engine/quiz";
import { defaultPostingDays, planWeek } from "@/lib/plan/week";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY = 86_400_000;
const LEVELS: FunnelLevel[] = ["top", "middle", "bottom"];
const OUTCOME_TINT: Record<FunnelLevel, string> = {
  top: "var(--color-lobe-stories)",
  middle: "var(--color-lobe-opinions)",
  bottom: "var(--color-lobe-receipts)",
};
const LINK = "underline underline-offset-2 hover:text-ink";
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function greetingFor(hour: number): string {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/** "14th" */
function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}

/** Names in their tints, joined "A and B" / "A, B and C". */
function TintedList({ regions }: { regions: string[] }) {
  return (
    <>
      {regions.map((r, i) => (
        <span key={r}>
          <span style={{ color: `var(--color-lobe-${r})` }}>{i === 0 ? REGION_LABELS[r as keyof typeof REGION_LABELS] : REGION_LABELS[r as keyof typeof REGION_LABELS].toLowerCase()}</span>
          {i < regions.length - 2 ? ", " : i === regions.length - 2 ? " and " : ""}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const store = useBrain();
  const capture = useCapture();
  const router = useRouter();
  // Dev only: ?demo=empty shows a brain with no posts yet; incomplete | posted as before.
  const demo = useSearchParams().get("demo");
  const brain = useMemo(() => {
    if (demo === "empty") return { ...store.brain, posts: [] };
    if (demo === "incomplete") return { ...store.brain, deepDiveStatus: "in_progress" as const, sittingsDone: 1 };
    return store.brain;
  }, [store.brain, demo]);
  const postedSlots = useMemo(() => (demo === "posted" ? { 2: "demo" } : demo ? {} : store.postedSlots), [demo, store.postedSlots]);
  const dumps = demo === "empty" ? [] : store.dumps;

  const firstName = brain.ownerName.split(" ")[0];
  const approved = brain.deepDiveStatus === "approved";

  // Time of day is the viewer's, so it's read after mount rather than on the server.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const today = now ?? new Date("2026-10-06T12:00:00");

  const usage = useMemo(() => laneUsage(brain, today), [brain, today]);
  const heat = useMemo(() => regionHeat(brain, usage), [brain, usage]);
  const mapped = Math.round(mappedShare(brain) * 100);
  const since = daysSinceLastPost(brain, today);
  const quiet = regionsQuiet(brain, today);
  const captures = capturesThisMonth(dumps, today);
  const fourWeeks = postsLastFourWeeks(brain, today);
  const run = longestRunWeeks(brain, today);
  const actual = actualMix30d(brain, today);
  const onBoard = brain.cards.filter((c) => c.privacy === "on_board");
  const regionsWithCards = new Set(onBoard.map((c) => c.regionKey)).size;
  const constructed = brain.cards.filter((c) => c.constructed).length;

  // The greeting's second line, in priority order.
  let line: React.ReactNode = `Your brain is ${mapped}% mapped.`;
  if (!approved && brain.sittingsDone < 3) {
    const next = brain.sittingsDone + 1;
    line = (
      <>
        Sitting {next} of 3 is waiting.{" "}
        <Link href={`/deep-dive?q=s${next}_1`} className={LINK}>
          Carry on
        </Link>
      </>
    );
  } else if (now) {
    const days = defaultPostingDays(brain.cadencePerWeek);
    const d = now.getDay();
    line = days.includes(d)
      ? `${DAYS[d]} is a posting day.`
      : `Next post ${DAYS[days.find((x) => x > d) ?? days[0]]}.`;
  }

  // Consistency.
  const share = fourWeeks.target ? fourWeeks.posted / fourWeeks.target : 0;
  const status = share >= 0.75 ? "On track" : share >= 0.5 ? "Slipping" : "Quiet";

  // Balance sentence.
  const blend = brain.observed?.blend ?? brain.quiz?.blend;
  const plan = blend ? planWeek({ situation: brain.goal, cadencePerWeek: brain.cadencePerWeek, mix: brain.mix, blend }) : null;
  let balance = "Close to your plan.";
  const missing = LEVELS.find((l) => actual[l] === 0);
  if (fourWeeks.posted === 0) balance = "Nothing posted yet. The week above is where to start.";
  else if (missing) {
    const slot = plan?.slots.find((s) => s.outcome === missing) ?? plan?.slots[0];
    const shape = slot ? slot.shape : SHAPE_FOR[brain.enginePrimary];
    balance = `Nothing ${OUTCOME_LABELS[missing]} in a month. One ${shape} would fix it${slot ? `; ${DAYS[slot.day]}'s slot can take it` : ""}.`;
  } else {
    const heavy = LEVELS.find((l) => actual[l] - brain.mix[l] > 20);
    const light = LEVELS.find((l) => brain.mix[l] - actual[l] > 20);
    if (heavy || light) balance = `Heavy on ${OUTCOME_LABELS[heavy ?? LEVELS.reduce((a, b) => (actual[b] - brain.mix[b] > actual[a] - brain.mix[a] ? b : a))]}, light on ${OUTCOME_LABELS[light ?? LEVELS.reduce((a, b) => (brain.mix[b] - actual[b] > brain.mix[a] - actual[a] ? b : a))]}.`;
  }

  // Needs you: at most two, in priority.
  const needs: React.ReactNode[] = [];
  if (constructed > 0) {
    needs.push(
      <>
        {constructed} card{constructed === 1 ? " is" : "s are"} still constructed.{" "}
        <Link href="/brain/board" className={LINK}>
          Approve {constructed === 1 ? "it" : "them"} on your board
        </Link>
        .
      </>
    );
  }
  const soon = brain.events
    .map((e) => ({ ...e, days: (new Date(e.date).getTime() - today.getTime()) / DAY }))
    .filter((e) => e.days >= 0 && e.days <= 14)
    .sort((a, b) => a.days - b.days)[0];
  if (soon) {
    needs.push(
      <>
        You have an event on the {ordinal(new Date(soon.date).getDate())} and{" "}
        <Link href="/studio" className={LINK}>
          nothing drafted
        </Link>
        .
      </>
    );
  }
  if (since !== null && since >= quietAfterDays(brain.cadencePerWeek)) {
    needs.push(
      <>
        You&apos;ve not posted in {since} days.{" "}
        <Link href="/studio" className={LINK}>
          Open Studio
        </Link>
        .
      </>
    );
  }

  const topUp = TOP_UP_QUESTIONS[0];
  const grew = !!store.topUpAnsweredAt;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[2.5rem] leading-tight">
            {now ? greetingFor(now.getHours()) : "Hello"}, {firstName}.
          </h1>
          <p className="mt-2 text-secondary">{line}</p>
        </div>
        <dl className="grid grid-cols-3 gap-6 md:gap-10">
          {[
            [`${mapped}%`, "of your brain mapped"],
            [since === null ? "–" : String(since), "days since you last posted"],
            [String(quiet.length), "regions gone quiet"],
          ].map(([figure, label]) => (
            <div key={label}>
              <dd className="display text-[2.5rem] leading-none">{figure}</dd>
              <dt className="mt-2 text-xs text-secondary">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Panels */}
      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        <Panel label="This week" span={8} link={{ href: "/brain/board#week", text: "Change my week" }}>
          {approved ? (
            <ThisWeek brain={brain} usage={usage} postedSlots={postedSlots} inPanel />
          ) : (
            <p className="text-sm text-secondary">Your week appears when your board is approved.</p>
          )}
        </Panel>

        <Panel label="Capture" span={4} className="cursor-pointer hover:border-secondary">
          <button type="button" onClick={capture.open} className="flex h-full w-full flex-col items-start gap-5 text-left">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-signal text-ink">
              <MicIcon size={26} />
            </span>
            <span>
              <span className="display block text-[1.5rem] leading-tight">Tell me something</span>
              <span className="mt-2 block text-sm text-secondary">
                A thought, a conversation, a thing that annoyed you today. Ninety seconds is plenty.
              </span>
            </span>
            <span className="mt-auto block text-xs text-secondary">
              {captures.count} capture{captures.count === 1 ? "" : "s"} this month
              {captures.lastWeekday ? ` · last one ${captures.lastWeekday}` : ""}
            </span>
          </button>
        </Panel>

        <Panel label="Your brain" span={4} link={{ href: "/brain", text: "Open the brain" }}>
          <div className="flex items-center gap-5">
            <div className="w-[170px] shrink-0">
              <BrainMap heat={heat} compact />
            </div>
            <div className="space-y-2 text-sm">
              <p>
                {onBoard.length} cards across {regionsWithCards} regions
              </p>
              {quiet.length > 0 && (
                <p className="text-secondary">
                  <TintedList regions={quiet} /> {quiet.length === 1 ? "has" : "have"} gone quiet
                </p>
              )}
              {constructed > 0 && (
                <p className="text-secondary">
                  {constructed} card{constructed === 1 ? "" : "s"} waiting for approval
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel label="Consistency" span={4} link={{ href: "/insights", text: "See insights" }}>
          <p>
            <span className="display text-[2.5rem] leading-none">
              {fourWeeks.posted} of {fourWeeks.target}
            </span>
            <span className="mt-2 block text-sm text-secondary">posts in the last four weeks</span>
          </p>
          <div className="mt-5 flex gap-4" aria-hidden>
            {fourWeeks.weeks.map((week, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex flex-col-reverse gap-1">
                  {Array.from({ length: week.target }, (_, j) => (
                    <span
                      key={j}
                      className={`h-2.5 w-2.5 rounded-full border ${j < week.posted ? "border-ink bg-ink" : "border-muted"}`}
                    />
                  ))}
                </div>
                <span className="h-4 text-xs text-secondary">{i === 3 ? "now" : ""}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm">{status}</p>
          <p className="mt-1 text-sm text-secondary">Longest run: {run} week{run === 1 ? "" : "s"}</p>
        </Panel>

        <Panel label="Balance" span={4}>
          {[
            ["Your plan", brain.mix],
            ["Last 30 days", actual],
          ].map(([label, mix]) => (
            <div key={label as string} className="mb-4">
              <p className="text-xs text-secondary">{label as string}</p>
              <div className="mt-1.5 flex h-2.5 gap-0.5 overflow-hidden rounded-sm" aria-hidden>
                {LEVELS.map((l) => (
                  <span key={l} style={{ width: `${(mix as typeof actual)[l]}%`, background: OUTCOME_TINT[l] }} />
                ))}
              </div>
            </div>
          ))}
          <p className="flex flex-wrap gap-x-4 text-xs text-secondary">
            {LEVELS.map((l) => (
              <span key={l} className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: OUTCOME_TINT[l] }} />
                {cap(OUTCOME_LABELS[l])}
              </span>
            ))}
          </p>
          <p className="mt-4 text-sm">{balance}</p>
        </Panel>

        {needs.length > 0 && (
          <Panel label="Needs you" span={6}>
            <ul className="border-b border-hairline">
              {needs.slice(0, 2).map((need, i) => (
                <li key={i} className="border-t border-hairline py-3 text-sm text-secondary">
                  {need}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel label="One more for your brain" span={6}>
          {grew ? (
            <p className="text-sm text-secondary">Your brain grew this week.</p>
          ) : store.topUpSkipped ? (
            <p className="text-sm text-secondary">Skipped. It&apos;ll be back next week.</p>
          ) : (
            <>
              <p className="text-base">{topUp.text}</p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <Button size="small" className="border-signal" onClick={() => router.push(`/deep-dive?q=${topUp.id}`)}>
                  Record an answer
                </Button>
                <Link href={`/deep-dive?q=${topUp.id}&type=1`} className={`text-sm text-secondary ${LINK}`}>
                  Type instead
                </Link>
                <button type="button" className={`text-sm text-secondary ${LINK}`} onClick={store.skipTopUp}>
                  Skip this week
                </button>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
