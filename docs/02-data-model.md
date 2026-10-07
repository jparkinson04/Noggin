# 02 — Data model

The brain is the root. Everything hangs off it. Types in `src/lib/brain/schema.ts`; tables in `src/db/schema.ts` and `supabase/migrations/0001_init.sql`.

## Entities

### brain
One per person (later: one per person per business).
- `id`, `owner_id`
- `goal`: `growing_audience | established_selling | full_with_clients | launching`
- `engine_primary`, `engine_secondary`: `storyteller | teacher | commentator | documenter`
- `mix_top`, `mix_middle`, `mix_bottom` (ints, sum to 100)
- `cadence_per_week`
- `headline` (the one line), `headline_options` (the three proposed)
- `deep_dive_status`: `not_started | in_progress | assembled | approved`

### region
Fixed set of seven, seeded per brain. Not user-creatable.
- `key`: `whys | stories | opinions | personality | receipts | engine | headline`

### question
The deep-dive question bank. Global, versioned, not per brain.
- `part` (1–5), `order`, `text`, `listening_for` (shown to the person as "why we ask"), `follow_up_hint`, `safety_line` (nullable)

### answer
One per question per brain. May have several takes.
- `question_id`, `brain_id`
- `medium`: `voice | text | file | photo`
- `audio_url` (Supabase Storage), `transcript`, `typed_text`
- `follow_up_question` (AI-generated, nullable), `follow_up_answer`
- `recorded_at`

### card
The atomic unit. One fact, story, opinion, receipt, or furniture item.
- `brain_id`, `region_key`
- `title` (short, the person's phrasing)
- `body` (their words, from the transcript; never paraphrased without `constructed`)
- `source_answer_id` (nullable — brain dumps can become cards too)
- `kind`: `why_internal | why_external | why_philosophical | story | opinion | opinion_reserve | furniture | signature | receipt_number | receipt_quote | receipt_win`
- `angles`: string[] — for stories and opinions, the retelling angles
- `keywords`: string[] — used by topic detection in the studio
- `is_lane`: boolean — can posts be filed under this?
- `constructed`: boolean — AI touched the wording and it's unapproved
- `approved_at`, `privacy`: `on_board | off_board` (default on, except anything flagged in the privacy pass)
- `funnel_default`: `top | middle | bottom` — where posts from this card usually sit

### post
- `brain_id`, `status`: `draft | scheduled | posted`
- `body`, `funnel_level`
- `lane_card_ids`: card[] — which lanes it draws from (detected + edited)
- `posted_at`, `linkedin_url` (nullable)
- `constructed_lines`: ranges that were AI-suggested and unapproved (cleared on edit/accept)

### lane_usage (derived, cached)
Per card where `is_lane`:
- `last_posted_at`, `post_count_90d`, `share_of_posts`, `heat` (0–1), `status`: `fresh | fading | quiet | overworked`
Computed by `src/lib/brain/heat.ts`. Thresholds scale with cadence: at 3 posts/week, "quiet" is 4 weeks; at 1/week, it's 8.

### brain_dump
- `brain_id`, `medium`, `audio_url`, `transcript`, `text`, `created_at`, `promoted_to_card_id` (nullable), `promoted_to_post_id` (nullable)

### photo
- `brain_id`, `storage_url`, `caption`, `card_ids` (tags), `uploaded_at`

### event
- `brain_id`, `title`, `date`, `notes`, `posted_about` (boolean, derived from posts referencing it)

### feed_item (global)
- `author_id` (founder/admin now, members later), `title`, `body`, `kind`: `tip | algorithm | trend | example`, `published_at`

### feed_comment (phase 3)

### analytics_snapshot
- `brain_id`, `period_start`, `period_end`, `impressions`, `engagements`, `followers`, `profile_views`, `notes` (achievements), `source`: `linkedin_export | manual`

## Relationships worth noting

- A `card` with `is_lane` is what the heat map tracks. Whys are lanes (a why gets retold), stories and opinions are lanes, furniture usually isn't (it's seasoning), receipts are lanes for bottom-of-funnel.
- A `post` can touch several lanes but should have **one purpose**. The studio warns if a draft reads as multipurpose.
- `constructed` is sticky: it survives until the human edits or explicitly approves. It's what makes the "AI never writes your posts" claim true.

## Region → brain visual mapping

Playful, not neuroscience, but each holds up to a one-sentence explanation:

| Region | Lobe | Why |
|---|---|---|
| Whys | Frontal | purpose, planning, who you decided to be |
| Stories | Temporal | memory |
| Opinions | Parietal | judgement, making sense of inputs |
| Personality | Limbic (centre) | emotion, the gush, what makes you you |
| Receipts | Occipital | seeing is believing |
| Engine & mix | Cerebellum | rhythm, coordination, cadence |
| Headline | Brainstem | everything runs through it |
