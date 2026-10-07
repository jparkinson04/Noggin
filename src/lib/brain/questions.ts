import type { RegionKey } from "./schema";

/**
 * The deep-dive question bank, v3. This is the product. Treat edits like schema changes.
 * 12 questions in three sittings, then a weekly top-up queue of the ones that didn't make the cut.
 * Wording is for anyone building a profile, not just founders: "this work", never "your business".
 */
export type SittingNumber = 1 | 2 | 3;

export interface Sitting {
  number: SittingNumber;
  title: string;
}

export interface Question {
  id: string;
  /** Null for top-up questions, which run after onboarding. */
  sitting: SittingNumber | null;
  /** Order within the sitting, from 1. For top-ups, order in the queue: lowest goes first. */
  position: number;
  region: RegionKey;
  text: string;
  /** A fixed follow-up prompt. Shown only after the first answer, and the person can skip it. */
  secondBeat?: string;
  /** Shown collapsed under the question. */
  whyWeAsk?: string;
  /** Always shown above the record button. */
  safetyLine?: string;
  /** One of the weekly extras rather than one of the 12. */
  topUp: boolean;
}

export const SITTINGS: Sitting[] = [
  { number: 1, title: "Your story" },
  { number: 2, title: "What you think" },
  { number: 3, title: "You, and proof" },
];

// Provisional: which 12 made the cut, their wording and their second beats are all placeholders
// from the v2 bank until the founder's exact text is pasted in. Only s1_2 (the founding moment)
// is known to be in the right place.
export const QUESTIONS: Question[] = [
  // Sitting 1 — Your story
  {
    id: "s1_1",
    sitting: 1,
    position: 1,
    region: "whys",
    text: "When the work goes right, what actually changes in someone's life? Tell me about one specific person or moment where it felt like it mattered.",
    secondBeat: "And what did that mean for them?",
    whyWeAsk: "A named scene, not a category. 'She cried on the call' beats 'we improve wellbeing'.",
    topUp: false,
  },
  {
    id: "s1_2",
    sitting: 1,
    position: 2,
    region: "stories",
    text: "Take me to the exact moment this work started. Not the year, the scene. Where were you, who was there, what was said?",
    secondBeat: "And what did you actually say?",
    whyWeAsk:
      "Dialogue you can still quote. The best answer is almost always a phone call, a kitchen table, or a car park.",
    topUp: false,
  },
  {
    id: "s1_3",
    sitting: 1,
    position: 3,
    region: "stories",
    text: "What happened by accident or luck that turned out to decide everything?",
    secondBeat: "What would you have done if it hadn't happened?",
    whyWeAsk: "The decision made in seconds.",
    topUp: false,
  },
  {
    id: "s1_4",
    sitting: 1,
    position: 4,
    region: "stories",
    text: "What were you doing before this, and what made you actually leave?",
    secondBeat: "Did you hate it, or did you love it?",
    whyWeAsk: "The real reason, not the LinkedIn reason.",
    topUp: false,
  },
  {
    id: "s1_5",
    sitting: 1,
    position: 5,
    region: "stories",
    text: "What's the hardest moment since starting? What nearly broke, and what did the people around you say?",
    whyWeAsk: "The wobble. The audience will know you by it.",
    safetyLine: "Nothing from this goes anywhere until you've decided it should.",
    topUp: false,
  },

  // Sitting 2 — What you think
  {
    id: "s2_1",
    sitting: 2,
    position: 1,
    region: "whys",
    text: "What do you believe about this work or your industry that would still be true if everything about how you do it changed tomorrow?",
    secondBeat: "When did you learn that?",
    whyWeAsk: "Beliefs with scar tissue. One you arrived at through failure will carry twenty posts.",
    topUp: false,
  },
  {
    id: "s2_2",
    sitting: 2,
    position: 2,
    region: "opinions",
    text: "What advice is common in your industry that you think is wrong?",
    secondBeat: "When did you first disagree with it?",
    whyWeAsk: "An opinion with a story attached: the moment you learned it.",
    topUp: false,
  },
  {
    id: "s2_3",
    sitting: 2,
    position: 3,
    region: "opinions",
    text: "What do you find yourself saying to the people you work with over and over?",
    whyWeAsk: "Your catchphrase. Say it the way you say it.",
    topUp: false,
  },
  {
    id: "s2_4",
    sitting: 2,
    position: 4,
    region: "opinions",
    text: "What gets you ranting in the pub?",
    secondBeat: "What was the last rant about, specifically?",
    whyWeAsk: "The energy. This is probably your commentator lane.",
    topUp: false,
  },

  // Sitting 3 — You, and proof
  {
    id: "s3_1",
    sitting: 3,
    position: 1,
    region: "personality",
    text: "Where did you grow up, and where are you now?",
    whyWeAsk: "Place is furniture. It makes you a person, not a provider.",
    topUp: false,
  },
  {
    id: "s3_2",
    sitting: 3,
    position: 2,
    region: "personality",
    text: "Who's in your household, pets included?",
    secondBeat: "Tell me more about the one you lit up talking about.",
    whyWeAsk: "Your recurring character. If you start gushing, that's them.",
    topUp: false,
  },
  {
    id: "s3_3",
    sitting: 3,
    position: 3,
    region: "receipts",
    text: "What do people say you give them, in their words?",
    secondBeat: "Any numbers you're quietly proud of, even small ones?",
    whyWeAsk: "The phrase that keeps coming up. Specific beats big.",
    topUp: false,
  },

  // Top-ups — one a week after onboarding, in this order
  {
    id: "top_1",
    sitting: null,
    position: 1,
    region: "whys",
    text: "Tell me about another person this work changed something for. One specific person, one moment where it felt like it mattered.",
    secondBeat: "And what did that mean for them?",
    whyWeAsk: "A second named scene. Two people is a pattern, and a pattern is a lane.",
    topUp: true,
  },
  {
    id: "top_2",
    sitting: null,
    position: 2,
    region: "personality",
    text: "What would the people around you say you're obsessed with?",
    whyWeAsk: "The thing you'd never think to post about.",
    topUp: true,
  },
  {
    id: "top_3",
    sitting: null,
    position: 3,
    region: "personality",
    text: "What did you study, and does any of it still show up?",
    whyWeAsk: "The old discipline hiding in the new work.",
    topUp: true,
  },
  {
    id: "top_4",
    sitting: null,
    position: 4,
    region: "whys",
    text: "Before this work existed, what did you assume your life was going to look like? When did that change?",
    secondBeat: "When exactly did it change? Where were you?",
    whyWeAsk: "The word you used before it became real: eventually, one day, someday.",
    topUp: true,
  },
  {
    id: "top_5",
    sitting: null,
    position: 5,
    region: "whys",
    text: "Honestly, what does this work give you that you'd be embarrassed to admit? Include the unglamorous reasons.",
    whyWeAsk: "The life design underneath the work: freedom, family, proving something, escaping something.",
    topUp: true,
  },
  {
    id: "top_6",
    sitting: null,
    position: 6,
    region: "opinions",
    text: "Is there anything you believe that would surprise your own industry?",
    whyWeAsk: "The reserve opinion. We'll hold it back for where you're heading next.",
    topUp: true,
  },
];

/** The 12, in the order they're asked. */
export const DEEP_DIVE_QUESTIONS: Question[] = QUESTIONS.filter((q) => !q.topUp).sort(
  (a, b) => (a.sitting ?? 0) - (b.sitting ?? 0) || a.position - b.position
);

/** The weekly queue, highest priority first. */
export const TOP_UP_QUESTIONS: Question[] = QUESTIONS.filter((q) => q.topUp).sort(
  (a, b) => a.position - b.position
);

export function questionsInSitting(sitting: SittingNumber): Question[] {
  return DEEP_DIVE_QUESTIONS.filter((q) => q.sitting === sitting);
}
