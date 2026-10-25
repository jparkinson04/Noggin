"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Answer } from "@/lib/brain/answers";
import { assemble as assembleBoard, funnelFor, kindFor } from "@/lib/brain/assemble";
import { brainFields, sittingsDone } from "@/lib/brain/savedBrain";
import type { Brain, Card, Engine, Goal, Post, QuizResult, RegionKey, SourceAnswer } from "@/lib/brain/schema";
import { mixFor } from "@/lib/engine/mix";
import { newId } from "@/lib/newId";
import { supabaseConfigured } from "@/lib/supabase/config";
import { SaveProblem } from "./SaveProblem";

/**
 * The one brain. The layout loads it (the person's own with Supabase, Maya's sample without) and
 * every edit goes through here. Board edits are the person's: they clear `constructed`. With
 * Supabase, the brain, its cards and approval save as they change; posts, events, brain dumps and
 * top-ups are still held in memory.
 */
/** A loose note from "Tell me something". Not yet a card. */
export interface BrainDump {
  id: string;
  at: string;
  answer: Answer;
}

interface BrainActions {
  brain: Brain;
  dumps: BrainDump[];
  /** Posting-day slots posted this week, day → post id. In memory, so it resets with the page. */
  postedSlots: Record<number, string>;
  /** The slot the person opened Studio from, so Mark as posted can tick it. */
  pendingSlot: number | null;
  /** When this week's top-up was answered, if it was. */
  topUpAnsweredAt: string | null;
  /** Skipping pushes the top-up a week. */
  topUpSkipped: boolean;
  skipTopUp: () => void;
  /** Captures not yet shown flying into the map. */
  flyIns: number;
  addDump: (answer: Answer) => void;
  consumeFlyIns: () => void;
  openSlot: (day: number | null) => void;
  addPost: (post: Post) => void;
  addEvent: (event: { date: string; title: string }) => void;
  removeEvent: (date: string, title: string) => void;
  markTopUpAnswered: () => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  removeCard: (id: string) => void;
  addCard: (region: RegionKey, title: string, body: string) => void;
  setHeadline: (line: string) => void;
  setEngineOverride: (primary: Engine, secondary?: Engine) => void;
  setSituation: (situation: Goal) => void;
  setQuiz: (quiz: QuizResult) => void;
  /** Turns deep-dive answers into proposed cards. With Supabase the server builds it from the saved answers. */
  assemble: (answers: SourceAnswer[]) => Promise<boolean>;
  approve: () => void;
  /** The deep dive moved on: keeps Home's "Sitting 2 of 3" right without a reload. */
  noteProgress: (answeredQuestionIds: string[]) => void;
}

const Ctx = createContext<BrainActions | null>(null);

export function useBrain(): BrainActions {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBrain needs a BrainProvider");
  return ctx;
}

const today = () => new Date().toISOString().slice(0, 10);

/** What needs saving: the brain's own fields, its approval, or one card (deleted if it's gone). */
type SyncKey = "brain" | "approve" | `card:${string}`;

const JSON_HEADERS = { "content-type": "application/json" };

async function send(key: SyncKey, brain: Brain): Promise<void> {
  let r: Response;
  if (key === "brain") {
    r = await fetch("/api/brain", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(brainFields(brain)) });
  } else if (key === "approve") {
    r = await fetch("/api/brain/approve", { method: "POST" });
  } else {
    const id = key.slice("card:".length);
    const card = brain.cards.find((c) => c.id === id);
    r = card
      ? await fetch(`/api/brain/cards/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(card) })
      : await fetch(`/api/brain/cards/${id}`, { method: "DELETE" });
  }
  if (!r.ok) throw new Error(`Saving ${key} failed with ${r.status}`);
}

export function BrainProvider({ initial, children }: { initial: Brain; children: ReactNode }) {
  const [brain, setBrain] = useState(initial);
  const [dumps, setDumps] = useState<BrainDump[]>([]);
  const [postedSlots, setPostedSlots] = useState<Record<number, string>>({});
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [topUpAnsweredAt, setTopUpAnsweredAt] = useState<string | null>(null);
  const [topUpSkipped, setTopUpSkipped] = useState(false);
  const [flyIns, setFlyIns] = useState(0);

  // The brain as it is right now, for saves that run after later changes have landed.
  const latest = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const unsaved = useRef(new Set<SyncKey>());
  const [saveFailed, setSaveFailed] = useState(false);

  /** Saves run one at a time, in the order the changes were made, each sending what's current. */
  const sync = useCallback((keys: SyncKey[]) => {
    if (!supabaseConfigured) return;
    for (const key of keys) {
      queue.current = queue.current.then(() =>
        send(key, latest.current).then(
          () => {
            unsaved.current.delete(key);
            if (!unsaved.current.size) setSaveFailed(false);
          },
          () => {
            unsaved.current.add(key);
            setSaveFailed(true);
          }
        )
      );
    }
  }, []);

  /** Every change to the brain comes through here, so `latest` is always what's on screen. */
  const commit = useCallback(
    (change: (b: Brain) => Brain, keys: SyncKey[] = []) => {
      latest.current = change(latest.current);
      setBrain(latest.current);
      sync(keys);
    },
    [sync]
  );

  const retrySave = useCallback(() => sync([...unsaved.current]), [sync]);

  const noteProgress = useCallback(
    (answered: string[]) => {
      const b = latest.current;
      if (b.deepDiveStatus === "assembled" || b.deepDiveStatus === "approved") return;
      const done = sittingsDone(answered);
      const status = answered.length ? "in_progress" : b.deepDiveStatus;
      if (done !== b.sittingsDone || status !== b.deepDiveStatus) commit((x) => ({ ...x, sittingsDone: done, deepDiveStatus: status }));
    },
    [commit]
  );

  const actions = useMemo<BrainActions>(
    () => ({
      brain,
      dumps,
      postedSlots,
      pendingSlot,
      topUpAnsweredAt,
      topUpSkipped,
      skipTopUp: () => setTopUpSkipped(true),
      flyIns,
      addDump: (answer) => {
        setDumps((all) => [{ id: `dump_${Date.now()}`, at: new Date().toISOString(), answer }, ...all]);
        setFlyIns((n) => n + 1);
      },
      consumeFlyIns: () => setFlyIns(0),
      openSlot: (day) => setPendingSlot(day),
      addEvent: (event) => commit((b) => ({ ...b, events: [...b.events, event] })),
      removeEvent: (date, title) => commit((b) => ({ ...b, events: b.events.filter((e) => !(e.date === date && e.title === title)) })),
      addPost: (post) => {
        commit((b) => ({ ...b, posts: [post, ...b.posts] }));
        if (pendingSlot !== null) {
          setPostedSlots((all) => ({ ...all, [pendingSlot]: post.id }));
          setPendingSlot(null);
        }
      },
      markTopUpAnswered: () => setTopUpAnsweredAt(today()),
      updateCard: (id, patch) =>
        commit(
          (b) => ({
            ...b,
            cards: b.cards.map((c) => (c.id === id ? { ...c, ...patch, constructed: false, approvedAt: c.approvedAt ?? today() } : c)),
          }),
          [`card:${id}`]
        ),
      removeCard: (id) => commit((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== id) }), [`card:${id}`]),
      addCard: (region, title, body) => {
        const id = newId();
        commit(
          (b) => ({
            ...b,
            cards: [
              ...b.cards,
              {
                id,
                regionKey: region,
                kind: kindFor(region),
                title,
                body,
                angles: [],
                keywords: [],
                isLane: region !== "personality",
                constructed: false,
                privacy: "on_board",
                funnelDefault: funnelFor(region),
                approvedAt: today(),
              },
            ],
          }),
          [`card:${id}`]
        );
      },
      setHeadline: (line) =>
        commit(
          (b) => ({
            ...b,
            headline: line,
            headlineOptions: b.headlineOptions.includes(line) ? b.headlineOptions : [line, ...b.headlineOptions].slice(0, 3),
          }),
          ["brain"]
        ),
      setEngineOverride: (primary, secondary) =>
        commit((b) => ({ ...b, enginePrimary: primary, engineSecondary: secondary, engineOverride: { primary, secondary, at: today() } }), ["brain"]),
      setSituation: (situation) => {
        const rule = mixFor(situation);
        commit((b) => ({ ...b, goal: situation, mix: rule.mix, cadencePerWeek: rule.cadencePerWeek }), ["brain"]);
      },
      setQuiz: (quiz) =>
        commit(
          (b) => ({
            ...b,
            quiz,
            goal: quiz.situation,
            mix: quiz.mix,
            cadencePerWeek: quiz.cadencePerWeek,
            // Until the deep dive is observed, the quiz is the engine.
            enginePrimary: b.observed?.primary ?? quiz.primary,
            engineSecondary: b.observed ? b.observed.secondary : quiz.secondary,
          }),
          ["brain"]
        ),
      assemble: async (answers) => {
        if (!supabaseConfigured) {
          commit((b) => assembleBoard(b, answers, (a) => `c_${a.id}`));
          return true;
        }
        // Anything still saving lands first, or it could undo the new board.
        await queue.current;
        const r = await fetch("/api/brain/assemble", { method: "POST" }).catch(() => null);
        if (!r?.ok) return false;
        const { brain: built } = (await r.json()) as { brain: Brain };
        commit(() => built);
        return true;
      },
      approve: () =>
        commit(
          (b) => ({
            ...b,
            deepDiveStatus: "approved",
            cards: b.cards.map((c) => ({ ...c, approvedAt: c.approvedAt ?? today() })),
          }),
          ["approve"]
        ),
      noteProgress,
    }),
    [brain, dumps, postedSlots, pendingSlot, topUpAnsweredAt, topUpSkipped, flyIns, commit, noteProgress]
  );

  return (
    <Ctx.Provider value={actions}>
      {children}
      {saveFailed && <SaveProblem onRetry={retrySave} />}
    </Ctx.Provider>
  );
}
