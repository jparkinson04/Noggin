/**
 * The brain. Everything in the product derives from these types.
 * See docs/02-data-model.md for the reasoning.
 */

export type RegionKey =
  | "whys"
  | "stories"
  | "opinions"
  | "personality"
  | "receipts"
  | "engine"
  | "headline";

export const REGION_KEYS: RegionKey[] = [
  "whys",
  "stories",
  "opinions",
  "personality",
  "receipts",
  "engine",
  "headline",
];

export const REGION_LABELS: Record<RegionKey, string> = {
  whys: "Whys",
  stories: "Stories",
  opinions: "Opinions",
  personality: "Personality",
  receipts: "Receipts",
  engine: "Engine",
  headline: "Headline",
};

/** One-line explanation shown when a region is empty or hovered. */
export const REGION_BLURBS: Record<RegionKey, string> = {
  whys: "Why you do this: for yourself, for the people you help, and the beliefs underneath.",
  stories: "The four scenes you'll retell forever: the start, the accident, the leaving, the wobble.",
  opinions: "What you believe about your industry that you've earned the right to say.",
  personality: "The furniture: where you're from, who's at home, what you're obsessed with.",
  receipts: "Proof. Numbers, kind messages, wins. This is what makes you credible.",
  engine: "How you naturally talk, how often you post, and the mix of visible, trustworthy and credible.",
  headline: "One line: who you help, what problem you solve, who you are.",
};

export type Engine = "storyteller" | "teacher" | "commentator" | "documenter";

export type Goal =
  | "growing_audience"
  | "established_selling"
  | "full_with_clients"
  | "launching";

/** Internal names. The person only ever sees the OUTCOME_LABELS: visible, trustworthy, credible. */
export type FunnelLevel = "top" | "middle" | "bottom";

export const OUTCOME_LABELS: Record<FunnelLevel, string> = {
  top: "visible",
  middle: "trustworthy",
  bottom: "credible",
};

export type CardKind =
  | "why_internal"
  | "why_external"
  | "why_philosophical"
  | "story"
  | "opinion"
  | "opinion_reserve"
  | "furniture"
  | "signature"
  | "receipt_number"
  | "receipt_quote"
  | "receipt_win";

export interface Card {
  id: string;
  regionKey: RegionKey;
  kind: CardKind;
  /** Short, in the person's phrasing where possible. */
  title: string;
  /** Their words. Lightly cleaned transcript, never paraphrased unless `constructed`. */
  body: string;
  angles: string[];
  keywords: string[];
  isLane: boolean;
  /** AI touched the wording and the person hasn't approved it yet. */
  constructed: boolean;
  privacy: "on_board" | "off_board";
  funnelDefault: FunnelLevel;
  approvedAt?: string;
  /** The answer this came from. */
  sourceAnswerId?: string;
}

export interface Post {
  id: string;
  status: "draft" | "scheduled" | "posted";
  body: string;
  funnelLevel: FunnelLevel;
  laneCardIds: string[];
  postedAt?: string;
}

export const ENGINES: Engine[] = ["storyteller", "teacher", "commentator", "documenter"];

export const ENGINE_LABELS: Record<Engine, string> = {
  storyteller: "Storyteller",
  teacher: "Teacher",
  commentator: "Commentator",
  documenter: "Documenter",
};

/** Four percentages summing to 100. */
export type EngineBlend = Record<Engine, number>;

export interface Mix {
  top: number;
  middle: number;
  bottom: number;
}

/** What the content engine quiz said. */
export interface QuizResult {
  blend: EngineBlend;
  primary: Engine;
  secondary?: Engine;
  situation: Goal;
  mix: Mix;
  cadencePerWeek: number;
  /** "One thing worth flagging", if a rule fired. */
  quizFlag: string | null;
  takenAt: string;
}

/** One answer's worth of evidence for an engine: the text, and where the markers hit. */
export interface EngineEvidence {
  answerId: string;
  text: string;
  score: number;
  /** [start, end) character ranges of matched phrases. */
  matches: [number, number][];
}

/** What the deep-dive answers showed. */
export interface ObservedEngine {
  blend: EngineBlend;
  primary: Engine;
  secondary?: Engine;
  evidence: Record<Engine, EngineEvidence[]>;
  /** How many answers opened with a scene, for the comparison sentence. */
  sceneOpeners: number;
  answerCount: number;
}

/** A deep-dive answer as kept on the brain: the source every card points back to. */
export interface SourceAnswer {
  id: string;
  questionId: string;
  text: string;
  date: string;
}

export interface Brain {
  id: string;
  ownerName: string;
  goal: Goal;
  enginePrimary: Engine;
  engineSecondary?: Engine;
  /** Set when the person picked an engine on the Board themselves. */
  engineOverride?: { primary: Engine; secondary?: Engine; at: string };
  quiz?: QuizResult;
  observed?: ObservedEngine;
  mix: Mix;
  cadencePerWeek: number;
  headline: string;
  /** The three lines the headline was chosen from. */
  headlineOptions: string[];
  deepDiveStatus: "not_started" | "in_progress" | "assembled" | "approved";
  /** Sittings finished so far, 0–3. */
  sittingsDone: number;
  /** Things in the diary that Studio can nudge about. */
  events: { date: string; title: string }[];
  answers: SourceAnswer[];
  cards: Card[];
  posts: Post[];
}

export type LaneStatus = "fresh" | "fading" | "quiet" | "overworked" | "unused";

export interface LaneUsage {
  cardId: string;
  lastPostedAt?: string;
  postCount90d: number;
  shareOfPosts: number;
  /** 0 = gone fully quiet, 1 = posted from this week. */
  heat: number;
  status: LaneStatus;
}
