# CLAUDE.md — brief for Claude Code

Read this before touching anything. Then read `docs/01-product.md` and `docs/03-design-system.md`.

## What we're building

A LinkedIn personal-brand tool built on a real consultancy process (Expert Voice). A person goes through a structured deep dive about themselves, mostly by voice note. The app turns their answers into a **brain**: a visual map of everything their content can draw from. Then they draft posts against that brain, and it tells them which parts of themselves they keep leaning on and which they've neglected.

The founder currently runs this process by hand for paying clients and it works: more impressions, more conversations, enquiries straight from posts. The software is that process, made self-serve.

## Non-negotiables

1. **The brain comes before any writing.** AI drafting is locked until the deep dive is complete. No shortcut, no "skip for now". The commitment is the point.
2. **AI never writes posts from nothing.** It can (a) ask follow-up questions during intake, (b) extract and organise what the person said into brain cards, (c) draft or tighten a post **only from brain cards the person has approved**, in their voice, and every constructed line is flagged. See `docs/04-ai-rules.md`.
3. **The person's words win.** Cards store what they actually said. Anything AI compresses or rewords is marked `constructed: true` until approved.
4. **Voice first.** Every intake question offers record-a-voice-note as the primary action and type-instead as the secondary. Voice gets longer, better answers.
5. **It must not look like a generic AI product.** No cream-and-terracotta, no purple gradients, no glass cards, no identical rounded cards with the same grey shadow, no ALL-CAPS eyebrow labels, no `→` on every link. The design system in `docs/03-design-system.md` is the law. If you're unsure whether something reads as default, it does.

## Working rules

- TypeScript strict. No `any` without a comment saying why.
- Tailwind v4. All colours, radii, and type sizes come from the tokens in `src/app/globals.css`. Never hardcode a hex in a component.
- Components are small and named for what the user sees, not how they're built (`RegionPanel`, not `SidebarDataContainer`).
- Copy is sentence case, plain verbs, no filler. Buttons say what happens: "Save card", "Record answer", "Mark as approved".
- Motion: one orchestrated moment per screen, max. The brain's "pulse" on the region that's gone quiet is the only ambient animation in the whole app. Respect `prefers-reduced-motion`.
- Phase 1 is sample-data only. Don't wire Supabase until `docs/05-roadmap.md` phase 2.
- Before adding a feature, check it's in the roadmap. If it isn't, add it to the roadmap first and ask.

## Key files

- `src/lib/brain/schema.ts` — the types. Everything else derives from these.
- `src/lib/brain/sampleBrain.ts` — a realistic fake brain for development.
- `src/lib/brain/heat.ts` — how "gone quiet" and "overworked" are calculated.
- `src/components/brain/BrainMap.tsx` — the hero. Treat it with care.
- `src/app/globals.css` — tokens.

## Vocabulary (use these words everywhere, UI and code)

| Word | Meaning |
|---|---|
| Brain | The whole map of one person: regions, cards, engine, mix, headline |
| Region | One of the seven zones (Whys, Stories, Opinions, Personality, Receipts, Engine, Headline) |
| Card | One fact, story, opinion, or receipt, in the person's own words |
| Lane | A card that posts can be filed under (stories and opinions are lanes; a why can be a lane too) |
| Gone quiet | A lane with no post in the last N weeks (N depends on cadence) |
| Overworked | A lane used far more than its share |
| Deep dive | The onboarding intake. Twelve questions in three sittings, one sitting a day by default |
| Top up | One extra deep-dive question a week, after onboarding, that keeps the brain growing |
| Brain dump | A loose note for later: a conversation, event, thought. Not yet a card |
| Engine | Primary content type: Storyteller, Teacher, Commentator, Documenter |
| Mix | Visible / trustworthy / credible percentages. In code: top / middle / bottom, never on screen |
| Cadence | Posts per week |
| Headline | The one line: who they help, what problem they solve, who they are |
| Receipt | Proof: a number, a testimonial, a win |
| Constructed | A line AI wrote or compressed that the person hasn't approved yet |
