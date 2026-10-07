# 03 — Design system

## The idea

**Points of light on a deep surface.** The product is dark: one near-black ground, hairlines instead of boxes, pale ink, and a brain made of warm dots in the middle. The dots are information: a region posted from recently is dense, a region that has gone quiet thins out, and the quietest one shows a faint ghost. The only ambient motion in the whole product is that ghost breathing.

Everything else is deliberately plain so the brain is the thing people remember. No light mode in v1.

This is a sibling to Expert Voice, not a child. It shares none of EV's palette (blue #527FE6 / orange #FC9F5B / Fraunces). If you find yourself reaching for warm cream, a serif display and a terracotta accent, or for purple-to-blue gradients and glass on black, stop: both are the standard "AI made this" look and this product must not have it.

The four mockups in `docs/screens/mockups/` are the target. Where this file and a mockup disagree, the mockup wins and this file gets fixed.

## Tokens

Defined in `src/app/globals.css` under `@theme static`. Use the token, never the hex.

### Base palette

| Token | Hex | Use |
|---|---|---|
| `ground` | `#1a1b1e` | the page. Everything sits on it |
| `raised` | `#202126` | used rarely: the capture block on Home and the avatar. Nothing else |
| `hairline` | `#2b2c32` | 1px rules and borders. No drop shadows anywhere |
| `ink` | `#ecebe6` | text, icons, the active nav link |
| `secondary` | `#8f929a` | secondary text, inactive nav links, placeholders |
| `muted` | `#5f626a` | the faintest text, disabled states, what a region's index dot fades to |
| `signal` | `#6b78ff` | the one accent: focus, active, recording, live detection, the capture dot |

There are no light tokens and no `prefers-color-scheme` block. `color-scheme: dark` is set on the page so native controls match.

### Lobe tints

Tuned for the dark ground, each a different hue so they stay distinct at any density. These are the only colours besides `signal`.

| Region | Token | Hex |
|---|---|---|
| Whys | `lobe-whys` | `#e0a39f` dusty rose |
| Stories | `lobe-stories` | `#e2c266` ochre |
| Opinions | `lobe-opinions` | `#8fb0e0` slate blue |
| Personality | `lobe-personality` | `#c7a9e3` lilac |
| Receipts | `lobe-receipts` | `#9fcf9b` sage |
| Engine | `lobe-engine` | `#c7ab7d` tan |
| Headline | `lobe-headline` | `#9a9ea8` pewter |

Heat no longer changes a tint. It changes how many dots a region shows and how bright they sit (see "The brain visual"). The one place a tint is still mixed toward `muted` by heat is the small dot beside each region name in the Brain index.

### Type

Two families, clearly different jobs.

- **Bricolage Grotesque** — display. Headings, the person's line, the big numbers in Insights, question text in the deep dive. Weight 600 for headings; 700 for the wordmark only. It has ink traps and a slightly wide stance, which gives the product a voice without a serif.
- **Figtree** — everything else. UI, body, cards, buttons. 400 and 500 only.

Scale (rem): 0.8125 / 0.9375 / 1.0625 / 1.25 / 1.5 / 2 / 2.75 / 3.5. Body line-height 1.55. Max measure 68ch.

No all-caps labels. No tracked-out eyebrows. No single italic word in a heading. Sentence case everywhere.

### Radii

Three, by hierarchy. Not one radius on everything.
- `r-sm` 4px — inputs, chips, tags
- `r-md` 10px — the capture block, the few raised panels
- `r-full` — the record button, the "Tell me something" pill and the avatar only

### Spacing

4px base. Page gutter 24px (16px mobile). Column padding 36px top, 40px sides.

## Vocabulary the person sees

The person never meets the words funnel, top, middle or bottom. In code the levels are still `top | middle | bottom`; `OUTCOME_LABELS` in `src/lib/brain/schema.ts` is the only way they reach the screen.

| Code | On screen | Means |
|---|---|---|
| `top` | **visible** | posts that reach people who don't know you yet |
| `middle` | **trustworthy** | posts that convince people who are weighing you up |
| `bottom` | **credible** | posts that give people a reason to act |

Every recommendation is labelled with which of the three it serves, and why now.

## The shell

Every destination sits in the same shell: a top bar, then one of two page shapes.

### Top bar

64px tall, hairline below, `ground` behind. Left to right:

- The wordmark, `public/logo-dark.svg` at 18px tall, linking to `/`.
- The nav: exactly three links, **Brain**, **Studio**, **Insights**. Active link in `ink`, the others in `secondary`. No icons, no badges.
- On the right, the capture pill: "Tell me something" in a `r-full` button with a hairline border and a 10px `signal` dot before the label. Then a 32px avatar circle on `raised`.

Nothing else in the bar. Brain dumps, Photos, Calendar, Feed and Analytics are not destinations and don't appear.

### Page shapes

Two, as components in `src/components/shell/`.

**a) Stage + Column.** A two-column grid, `1fr` and 460px. The stage holds the one big thing on the page (the brain, the editor); the column holds what explains it. The column has a hairline left border and 36px top / 40px side padding.

**b)** *(The brief that defined this section was cut off after the Stage + Column padding. The second shape, the mobile rules and any per-page specifics are still to be written from the mockups.)*

### Surfaces

Panels are made with hairlines and spacing, not boxes. `raised` appears exactly twice: the capture block on Home and the avatar. Inputs sit on `ground` with a hairline border.

## The brain visual

`src/components/brain/BrainMap.tsx`. Side view, facing left, drawn as a scatter of dots inside a faint silhouette (1px `ink` at 16% opacity). No lobe outlines, no borders, no labels on the drawing; the parent shows the name of whatever is under the cursor.

Seven regions, each a cloud of dots in its own tint. Dot count follows heat (0–1): a region at full heat is dense, a region at zero still has a few faint dots so it reads as a place. Dots are seeded so the same brain always looks the same, with radius 2.6–5.8 and opacity 0.55–1. The cerebellum (Engine) and stem (Headline) sit below the silhouette.

- **Hover pull:** dots within 110 viewBox units of the cursor drift toward it, stronger the closer they are, by at most 42% of the distance, and swell up to 60%. They ease back; they never snap. Off under `prefers-reduced-motion` and on touch.
- **Selection:** click or tap selects a region; every other region dims to 35%. Hovering with nothing selected does the same.
- **Ghost:** the quietest region shows a faint dashed outline of its shape in its tint. It carries `.pulse` and is the only thing that breathes.
- **Highlight:** regions a draft touches turn `signal`. The studio's mini brain uses this, in `compact` mode: same scatter, no interaction, no ghost.

It should feel drawn, not rendered: no gradients, no glow, no outlines.

## Motion

- The ghost's pulse: the only ambient animation.
- Region select: column content swaps with a 120ms fade. No slide.
- Record button: ring expands while recording. Stops when stopped.
- Deep dive second beat: arrives once, below the first answer, 320ms. Off under `prefers-reduced-motion`.
- Nothing fades-and-slides-up on page load.

## What we never do

- Drop shadows, glassmorphism, gradient washes
- The same card shape chopped across every screen
- Purple-to-blue gradients, neon on black
- `→` appended to links
- Middle-dot meta strings as decoration (one in the engine line is fine; it's data)
- Emoji in UI copy
- Loading spinners where a skeleton or the real thing would do

## Logo

`public/logo-dark.svg` (chalk on dark) is the wordmark in product: "noggin" in Bricolage Grotesque 96pt Bold, outlined to paths so it needs no font, with the tittle of the i replaced by the seven-lobe brain in `signal`. The tittle is 0.34em wide, centred on the stem, 0.04em above the x-height, with the brainstem removed at this scale. `public/logo.svg` (ink on light) is kept for print and light backgrounds outside the product. `public/favicon.svg` is the mark alone: stories lobe lit. Never add a drop shadow, outline, or gradient to any of them. Minimum wordmark width 96px; below that use the favicon mark. In the top bar it sits at 18px tall.
