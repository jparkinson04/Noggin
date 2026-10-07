# 05 — Roadmap

Build in this order. Each phase ends with something you'd actually use for your own brand.

## Phase 1 — The brain, on sample data (no backend)

Goal: get the hero right before anything else. If the brain visual and the studio nudge don't feel good with fake data, nothing downstream will save it.

- [ ] Tokens and type in `globals.css`
- [ ] `BrainMap` with seven regions, heat-driven tint, selection, pulse
- [ ] Brain home: region index, brain, inspector with cards
- [ ] `heat.ts`: gone quiet / fading / fresh / overworked from sample posts
- [ ] Post studio with mini brain, keyword lane detection, gone-quiet list
- [ ] Mark-as-posted updates heat live (in memory)
- [ ] Mobile layout for both screens
- [ ] Screenshot review against `docs/03-design-system.md`

Done when: you'd happily show it to a client and say "this is your brain".

## Phase 2 — Real brains (Supabase, auth, voice)

- [ ] Supabase project, run `0001_init.sql`, Drizzle client
- [ ] Email magic-link auth
- [ ] Deep dive flow: one question per screen, drip schedule, record / type / upload
- [ ] Voice recording in the browser (MediaRecorder), upload to Storage
- [ ] Transcription route (Whisper or Deepgram)
- [ ] AI follow-up job (one per question, skippable)
- [ ] AI extract job → proposed cards, engine diagnosis, headline options
- [ ] Walkthrough screen: approve / edit / delete cards, confirm engine, mix, cadence, pick headline
- [ ] Studio unlock gate on `approved`
- [ ] AI draft-help actions with constructed-line marking
- [ ] Brain dumps, photo bank, calendar (simple CRUD)

Done when: you've migrated one real client's brain board into it and used it for a month.

## Phase 3 — Keeping people (digest, analytics, feed, payments)

- [ ] Weekly digest email: posted, gone quiet, one unused card
- [ ] Analytics: LinkedIn export upload, charts, lane usage over time, one-page report export
- [ ] Feed intelligence: admin posts tips; members read
- [ ] Stripe subscriptions: Solo / Guided
- [ ] Onboarding emails for the deep dive drip

Done when: strangers pay and come back.

## Phase 4 — Community and teams

- [ ] Comments on feed items
- [ ] Member-submitted tips with moderation
- [ ] Public "show your brain" profile (trimmed, opt-in)
- [ ] Team brains under one business, combined analytics
- [ ] Event-aware nudges ("event in 9 days, no post yet")

## Later / maybe

- Embedding-based lane detection replacing keywords
- LinkedIn API posting (if access is granted; don't build around it)
- Blog/newsletter repurposing from cards
- A "guided" tier with a live walkthrough call booked in-app
