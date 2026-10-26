import { kindFor } from "@/lib/brain/assemble";
import type { Card, CardKind, FunnelLevel, RegionKey, SourceAnswer } from "@/lib/brain/schema";

/**
 * What the extract job proposes, turned into cards. The rules in docs/04-ai-rules.md are enforced
 * here, whatever the model said: a body that isn't the person's words is constructed, anything
 * involving other people starts off the board, and nothing is approved until they say so.
 */

export type BoardRegion = Exclude<RegionKey, "engine" | "headline">;

export interface ExtractedCard {
  answerId: string;
  region: BoardRegion;
  kind: CardKind;
  title: string;
  body: string;
  angles: string[];
  keywords: string[];
  outcome: "visible" | "trustworthy" | "credible";
  involvesOthers: boolean;
}

export interface ExtractOutput {
  cards: ExtractedCard[];
  headlines: string[];
}

const KINDS: Record<BoardRegion, CardKind[]> = {
  whys: ["why_internal", "why_external", "why_philosophical"],
  stories: ["story"],
  opinions: ["opinion", "opinion_reserve"],
  personality: ["furniture", "signature"],
  receipts: ["receipt_number", "receipt_quote", "receipt_win"],
};
const FUNNEL: Record<ExtractedCard["outcome"], FunnelLevel> = { visible: "top", trustworthy: "middle", credible: "bottom" };
const FILLERS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm"]);
const MAX_PER_ANSWER = 4;

/** Lowercase words with fillers and stutters taken out, so "Um, I I said" and "I said" match. */
function plainWords(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().replace(/[’‘]/g, "'").split(/[^a-z0-9']+/)) {
    const word = raw.replace(/^'+|'+$/g, "");
    if (!word || FILLERS.has(word) || out[out.length - 1] === word) continue;
    out.push(word);
  }
  return out;
}

/** True when `text` is a run of the person's own words from `source`, give or take ums, stutters and punctuation. */
export function isTheirWords(text: string, source: string): boolean {
  const said = plainWords(text).join(" ");
  return said.length > 0 && ` ${plainWords(source).join(" ")} `.includes(` ${said} `);
}

export function toProposedCards(output: ExtractOutput, sources: SourceAnswer[], newId: () => string): Card[] {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const perAnswer = new Map<string, number>();
  const cards: Card[] = [];
  for (const c of output.cards) {
    const source = byId.get(c.answerId);
    const title = c.title.trim();
    const body = c.body.trim();
    if (!source || !title || !body || !KINDS[c.region]) continue;
    const count = perAnswer.get(source.id) ?? 0;
    if (count >= MAX_PER_ANSWER) continue;
    perAnswer.set(source.id, count + 1);

    const kind = KINDS[c.region].includes(c.kind) ? c.kind : kindFor(c.region);
    const retold = kind === "story" || kind === "opinion" || kind === "opinion_reserve";
    cards.push({
      id: newId(),
      regionKey: c.region,
      kind,
      title: title.slice(0, 120),
      body,
      angles: retold ? c.angles.map((a) => a.trim()).filter(Boolean).slice(0, 3) : [],
      keywords: [...new Set(c.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))].slice(0, 6),
      isLane: c.region !== "personality",
      constructed: !isTheirWords(body, source.text),
      privacy: c.involvesOthers ? "off_board" : "on_board",
      funnelDefault: FUNNEL[c.outcome] ?? "middle",
      sourceAnswerId: source.id,
    });
  }
  return cards;
}

/** Up to three distinct headline options. */
export function headlinesFrom(output: ExtractOutput): string[] {
  return [...new Set(output.headlines.map((h) => h.trim()).filter(Boolean))].slice(0, 3);
}
