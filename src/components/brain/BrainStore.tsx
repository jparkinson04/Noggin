"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Answer } from "@/lib/brain/answers";
import type { Brain, Card, Engine, Goal, Post, QuizResult, RegionKey, SourceAnswer } from "@/lib/brain/schema";
import { sampleBrain } from "@/lib/brain/sampleBrain";
import { observeEngine } from "@/lib/engine/observe";
import { mixFor } from "@/lib/engine/mix";
import { QUESTIONS } from "@/lib/brain/questions";

/**
 * The one brain, held in memory for now. Every edit on the Board goes through here and is the
 * person's: it clears `constructed`. Phase 2 swaps the state for Supabase.
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
  /** Turns deep-dive answers into proposed cards: one per answer, title = first six words. */
  assemble: (answers: SourceAnswer[]) => void;
  approve: () => void;
}

const Ctx = createContext<BrainActions | null>(null);

export function useBrain(): BrainActions {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBrain needs a BrainProvider");
  return ctx;
}

const today = () => new Date().toISOString().slice(0, 10);
const firstSixWords = (text: string) => text.trim().split(/\s+/).slice(0, 6).join(" ").replace(/[.,;:!?]$/, "");

export function BrainProvider({ children }: { children: ReactNode }) {
  const [brain, setBrain] = useState<Brain>(() => ({
    ...sampleBrain,
    observed: observeEngine(sampleBrain.answers),
  }));
  const [dumps, setDumps] = useState<BrainDump[]>([]);
  const [postedSlots, setPostedSlots] = useState<Record<number, string>>({});
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [topUpAnsweredAt, setTopUpAnsweredAt] = useState<string | null>(null);
  const [topUpSkipped, setTopUpSkipped] = useState(false);
  const [flyIns, setFlyIns] = useState(0);

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
      addEvent: (event) => setBrain((b) => ({ ...b, events: [...b.events, event] })),
      removeEvent: (date, title) => setBrain((b) => ({ ...b, events: b.events.filter((e) => !(e.date === date && e.title === title)) })),
      addPost: (post) => {
        setBrain((b) => ({ ...b, posts: [post, ...b.posts] }));
        if (pendingSlot !== null) {
          setPostedSlots((all) => ({ ...all, [pendingSlot]: post.id }));
          setPendingSlot(null);
        }
      },
      markTopUpAnswered: () => setTopUpAnsweredAt(today()),
      updateCard: (id, patch) =>
        setBrain((b) => ({
          ...b,
          cards: b.cards.map((c) => (c.id === id ? { ...c, ...patch, constructed: false, approvedAt: c.approvedAt ?? today() } : c)),
        })),
      removeCard: (id) => setBrain((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== id) })),
      addCard: (region, title, body) =>
        setBrain((b) => ({
          ...b,
          cards: [
            ...b.cards,
            {
              id: `c_${Date.now()}`,
              regionKey: region,
              kind: region === "stories" ? "story" : region === "opinions" ? "opinion" : region === "receipts" ? "receipt_win" : region === "personality" ? "furniture" : "why_internal",
              title,
              body,
              angles: [],
              keywords: [],
              isLane: region !== "personality",
              constructed: false,
              privacy: "on_board",
              funnelDefault: region === "receipts" ? "bottom" : region === "opinions" ? "middle" : "top",
              approvedAt: today(),
            },
          ],
        })),
      setHeadline: (line) =>
        setBrain((b) => ({
          ...b,
          headline: line,
          headlineOptions: b.headlineOptions.includes(line) ? b.headlineOptions : [line, ...b.headlineOptions].slice(0, 3),
        })),
      setEngineOverride: (primary, secondary) =>
        setBrain((b) => ({ ...b, enginePrimary: primary, engineSecondary: secondary, engineOverride: { primary, secondary, at: today() } })),
      setSituation: (situation) => {
        const rule = mixFor(situation);
        setBrain((b) => ({ ...b, goal: situation, mix: rule.mix, cadencePerWeek: rule.cadencePerWeek }));
      },
      setQuiz: (quiz) =>
        setBrain((b) => ({
          ...b,
          quiz,
          goal: quiz.situation,
          mix: quiz.mix,
          cadencePerWeek: quiz.cadencePerWeek,
          // Until the deep dive is observed, the quiz is the engine.
          enginePrimary: b.observed?.primary ?? quiz.primary,
          engineSecondary: b.observed ? b.observed.secondary : quiz.secondary,
        })),
      assemble: (answers) => {
        const observed = observeEngine(answers);
        setBrain((b) => ({
          ...b,
          answers,
          observed,
          enginePrimary: b.engineOverride?.primary ?? observed?.primary ?? b.enginePrimary,
          engineSecondary: b.engineOverride ? b.engineOverride.secondary : (observed?.secondary ?? b.engineSecondary),
          deepDiveStatus: "assembled",
          sittingsDone: 3,
          cards: answers.map((a) => {
            const q = QUESTIONS.find((x) => x.id === a.questionId);
            const region: RegionKey = q?.region ?? "whys";
            return {
              id: `c_${a.id}`,
              regionKey: region,
              kind: region === "stories" ? "story" : region === "opinions" ? "opinion" : region === "receipts" ? "receipt_win" : region === "personality" ? "furniture" : "why_internal",
              title: firstSixWords(a.text),
              body: a.text,
              angles: [],
              keywords: [],
              isLane: region !== "personality",
              constructed: false,
              privacy: "on_board",
              funnelDefault: region === "receipts" ? "bottom" : region === "opinions" ? "middle" : "top",
              sourceAnswerId: a.id,
            } satisfies Card;
          }),
        }));
      },
      approve: () =>
        setBrain((b) => ({
          ...b,
          deepDiveStatus: "approved",
          cards: b.cards.map((c) => ({ ...c, approvedAt: c.approvedAt ?? today() })),
        })),
    }),
    [brain, dumps, postedSlots, pendingSlot, topUpAnsweredAt, topUpSkipped, flyIns]
  );

  return <Ctx.Provider value={actions}>{children}</Ctx.Provider>;
}
