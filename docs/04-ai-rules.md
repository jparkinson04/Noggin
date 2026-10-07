# 04 — AI rules

The whole pitch is "it knows you before it writes a word, and even then it writes from your words". These rules make that true. They are product rules, not just prompt rules: enforce them in code (gates, flags) not just in the system prompt.

## The three jobs AI is allowed to do

### 1. Follow up (during the deep dive)

Input: the question, its `listening_for` note, the transcript of the answer.
Output: either `null` or **one** follow-up question.

Fire a follow-up only when:
- the answer is abstract or category-level ("we improve wellbeing") → ask for the scene: where, who, what was said
- the answer is a press-release version → "and what did you actually say?"
- the person started gushing about something → dig there, because unprompted enthusiasm is where the best material is
- they contradicted themselves → point at it gently; the contradiction is usually a story

Never more than one follow-up per question. Always skippable. Never for the hardest-moment question unless they've opted in.

### 2. Extract (assembling the brain)

Input: all transcripts for a part.
Output: cards, each with `title`, `body`, `kind`, `keywords`, `angles` (stories/opinions), `funnel_default`, and `constructed`.

- `body` is a lightly cleaned quote from the transcript (remove ums, keep phrasing). If you compress or combine, `constructed: true`.
- `title` is a short phrase in their words if one exists ("the car park phone call"), otherwise constructed.
- Propose, never decide. Everything lands as "proposed" and the person approves, edits, or deletes.
- Also output an **engine diagnosis** with evidence: quote the three answers that most show scenes / frameworks / judgements / narration. Primary + secondary. The person confirms.
- Also output three **headline** options from the whole board. Who they help, what problem they solve, who they are. No buzzwords.

Opinion test, applied before proposing an opinion card: is it earned (a moment attached)? Does it point forwards? Would they defend it in the comments? If an opinion fails all three, propose it as `opinion_reserve` with a note.

Privacy: anything mentioning other named people, children, exes, or family situations is proposed with `privacy: off_board` and a toggle. Default out.

### 3. Draft help (in the studio)

Locked until `deep_dive_status = approved`. No exceptions, no "skip for now".

Allowed actions, each one button:
- **Tighten** — shorten the person's own draft without changing meaning or adding claims
- **Opening line** — three first lines for a specific, approved card, in the person's phrasing patterns
- **Angles** — three ways to retell a specific story or opinion card
- **Full draft** — a post from one approved card and one angle. Only from cards. Only one purpose per post.

Every line AI produces is `constructed` until the person edits it or taps "Keep". Constructed lines are visually marked in the editor (a thin `signal` left border). A post cannot be marked as posted while any line is still constructed.

Voice rules in the system prompt: use only vocabulary that appears in their cards and transcripts; mirror their sentence length; no "In today's fast-paced world", no "game-changer", no "Let that sink in", no rhetorical "Why? Because". If the person never uses emoji, none. If their transcripts are full of "to be honest" and "look", those are allowed; they're theirs.

### 4. Detect (in the studio, not generative)

Which lanes does this draft touch? Which funnel level does it read as? Does it have more than one purpose? This can start as keyword overlap (`detectTopics.ts`) and move to embeddings later. Output is shown as editable chips, never silently applied.

## What AI must never do

- Write a post for someone whose brain isn't approved
- Invent a story, a number, a client, a quote
- Paraphrase a card into the post without marking it constructed
- Suggest topics outside the brain ("you could also post about AI trends")
- Run any of this silently. Every AI action is a button the person pressed.

## Model and prompts

Use the Anthropic API. One system prompt per job, in `src/lib/ai/prompts/`. Each prompt gets the relevant cards as structured JSON, not prose, so the model can't blur them. Log every call with job name, card ids used, and whether the output was accepted or edited; that log is how you'll find out which prompts need work.
