import type { Engine, EngineEvidence, ObservedEngine, SourceAnswer } from "../brain/schema";
import { ENGINES } from "../brain/schema";
import { enginesFrom, toPercentages } from "./mix";

/**
 * Engine diagnosis from how someone answered, not what they said they were.
 * Rule-based markers, all in MARKERS so they're easy to tune. Each hit counts once;
 * an answer's score for an engine is hits per hundred words, so long answers don't win by length.
 */
export const MARKERS: Record<Engine, RegExp[]> = {
  storyteller: [
    // Scenes: places, times of day, named people, quoted speech, narrative past tense.
    /\b(in|at|on|outside|inside|from) (the|a|my|our|her|his) [a-z]+( [a-z]+)? (room|floor|park|car|kitchen|office|ward|hospital|call|table|bay|corridor|desk|shop|train|pub|garden)\b/gi,
    /\b(three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d{1,2}) (in the morning|at night|o'?clock|am|pm)\b/gi,
    /\b(morning|afternoon|evening|night shift|midnight|that night|that morning|that day|the next day|a week later|years? later|days? later)\b/gi,
    /\b[A-Z][a-z]+ (rang|called|said|asked|told|found|looked|sat|stood|walked|turned|laughed|cried|texted)\b/g,
    /["“][^"”]{3,}["”]|(^|\s)['‘][^'’]{3,}['’](?=[\s.,!?;:]|$)/g,
    /\bI (was|sat|stood|walked|drove|rang|picked up|looked|remember|handed|went|found|opened|got|joined|stayed|applied|left|loved|grew up|didn't go)\b/gi,
    /\b(car park|hospital|ward|icu|a&e|sluice room|zoom call|kitchen table|the floor|my dad's shop|above the shop|the car outside|on camera|the street)\b/gi,
    /\b(booked|brought|handed|rang|stayed|texted|turned up|showed up|sat down|got up)\b/gi,
  ],
  teacher: [
    // Structure: steps, counts, frames, definitions, rules.
    /\b(first|second|third|fourth|fifth|step one|step two|step three|number one|number two)\b/gi,
    /\b(two|three|four|five|six|seven|\d) (things|steps|rules|questions|ways|parts|reasons|mistakes|signs|principles)\b/gi,
    /\b(the way I|the first thing|the last thing|the rule is|the trick is|the key is|what I tell|what I teach|here's how|the framework|the model|the method)\b/gi,
    /\b(means|is defined as|is simply|in other words|which is to say|put simply|the difference between)\b/gi,
    /\b(always|never) (start|begin|ask|do|say|assume|skip)\b/gi,
  ],
  commentator: [
    // Judgement: wrong, should, the problem with, nobody talks about, present-tense claims about the industry.
    /\b(wrong|a lie|nonsense|rubbish|broken|lazy|dishonest|outdated|pointless)\b/gi,
    /\b(should|shouldn't|needs? to|ought to|has to|must)\b/gi,
    /\b(the problem with|the trouble with|what's wrong with|the myth|the lie we tell|nobody talks about|no one talks about|everyone says|people assume|the industry)\b/gi,
    /\b(burnout|recruitment|the sector|the system|the rota|hr|management|leadership|the profession|the nhs|linkedin) (is|isn't|are|aren't|doesn't|don't|won't|keeps?|treats?)\b/gi,
    /\bI('ll| will)? (say|argue|believe|think|maintain) (that|this|it)\b/gi,
  ],
  documenter: [
    // Process: right now, in progress, the number this week.
    /\b(this week|this month|today|yesterday|last week|right now|at the moment|currently|these days|lately)\b/gi,
    /\bI'?m (trying|building|testing|working on|figuring out|learning|running|writing|tracking|noticing)\b/gi,
    /\b(just did|just finished|just started|just ran|just had|so far|in progress|halfway|day \d+|week \d+)\b/gi,
    /\b\d+ (so far|this week|this month|today|down|to go|done|booked|signed|left)\b/gi,
  ],
};

/** Does the answer open with a scene? Counted for the comparison sentence. */
const SCENE_OPENER =
  /^\s*(([A-Z][a-z]+ (rang|called|said|found|booked|walked|texted|turned))|(I|We) (was|were|sat|joined|handed|applied|stood|walked|drove|rang|went|got|grew|found|left|stayed)|Grew up|Me,|It was|That (night|day|morning|week)|Last (week|year|month|night)|Three|Two|Four|Five|Six|Ten|Twelve|Twenty|\d|January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/;

const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function scoreAnswer(text: string, engine: Engine): { score: number; matches: [number, number][] } {
  const matches: [number, number][] = [];
  for (const re of MARKERS[engine]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const start = m.index + (m[0].length - m[0].trimStart().length);
      matches.push([start, m.index + m[0].length]);
      if (!re.global) break;
    }
  }
  // Merge overlaps so the markup never nests.
  matches.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]);
    else merged.push([m[0], m[1]]);
  }
  const words = Math.max(wordCount(text), 20);
  return { score: (merged.length / words) * 100, matches: merged };
}

export function observeEngine(answers: SourceAnswer[]): ObservedEngine | undefined {
  const usable = answers.filter((a) => a.text.trim());
  if (!usable.length) return undefined;

  const totals = Object.fromEntries(ENGINES.map((e) => [e, 0])) as Record<Engine, number>;
  const evidence = Object.fromEntries(ENGINES.map((e) => [e, [] as EngineEvidence[]])) as Record<Engine, EngineEvidence[]>;

  for (const answer of usable) {
    for (const engine of ENGINES) {
      const { score, matches } = scoreAnswer(answer.text, engine);
      totals[engine] += score;
      if (score > 0) evidence[engine].push({ answerId: answer.id, text: answer.text, score, matches });
    }
  }
  for (const engine of ENGINES) {
    evidence[engine] = evidence[engine].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  const blend = toPercentages(totals);
  return {
    blend,
    ...enginesFrom(blend),
    evidence,
    sceneOpeners: usable.filter((a) => SCENE_OPENER.test(a.text)).length,
    answerCount: usable.length,
  };
}
