# PRODUCT.md, v2.0

What Noggin is, who buys it, what it does, and what it refuses to do. This file lives in the repo root alongside DESIGN.md and is read before any feature work. Where this file and a convenient implementation disagree, this file wins.

v2.0 replaces v1.x. The change: v1 was a software copy of a consultancy's workflow. v2 is a product that someone buys to get an outcome. The methodology is the same; the product is built around the buyer, not the consultant.

---

## 1. The product in one paragraph

Noggin builds a personal brand from what someone has actually lived, and keeps it alive. A founder, a professional, or a team answers a short deep dive by voice. Noggin turns it into a brain: a map of everything they can credibly say in public, organised into the regions a personal brand needs. From then on it tells them what's worth saying this week, keeps them drawing from all of themselves rather than the same three things, and shows them whether it's working. It never writes the post. The words are theirs, which is the point.

The belief underneath: **a personal brand is a business asset, and the only one that can't be copied is the person.** Everything that has happened to you is unique. The skill is knowing which of it to say out loud, and when. Noggin supplies the skill.

---

## 2. Who buys it, and what they're buying

Three buyers, one outcome.

| Buyer | Why they're here | What success looks like to them |
|---|---|---|
| **The founder** | Their business is them. Enquiries, hires, investors and partners all check the person first. They've noticed the honest post got forty comments and the AI one got nothing. | Inbound conversations from people who already trust them |
| **The individual professional** | A consultant, a specialist, a senior employee, someone changing direction. They know they should be visible and don't know what to say. | Being known for something specific, by the right people |
| **The team** | A business where several people should be visible: a leadership team, a founding team, a practice. They want one story told by several real voices, not a company page nobody reads. | Coverage: the right people saying the right things, without a content agency |

The outcome, in the buyer's words: **trustworthy, credible, visible.** These three map directly onto how the product thinks about content, so the user never meets the word "funnel":

- **Visible**: posts that reach people who don't know you yet. Stories, personality, the things that make you a person.
- **Trustworthy**: posts that convince people who are weighing you up. Opinions, lessons, how you think.
- **Credible**: posts that give people a reason to act. Receipts, proof, what you've done.

Every recommendation Noggin makes is labelled with which of the three it serves, and why now.

Not for: content agencies running many accounts, anyone wanting volume, anyone who wants it written for them. Those people have Taplio and Supergrow. Noggin is for people who want to be known for what they actually think.

---

## 3. Non-negotiables

Enforced in product behaviour and code, not just copy.

1. **Noggin never writes posts.** No generated drafts, no ready-to-publish hooks, no "ten posts in one click". There is no `writeLinkedInPost()` function anywhere in the codebase. AI questions, extracts, connects, recommends, explains and tightens. It does not impersonate. This is the product's single biggest differentiator and it is also what makes the output work: LinkedIn's ranking now actively deprioritises generic AI copy.
2. **The sign-off rule.** The brain only ever contains the person's words and the person's facts. Anything the system constructs or compresses from what they said is visibly flagged as constructed and needs their approval before it joins the brain. The interface renders verbatim and constructed text differently (DESIGN.md 2.5), and the data model carries a `verbatim` flag on every piece of text.
3. **Everything is traceable.** Every element of the brain can show its origin: which answer or capture it came from, on which date. If a line can't be traced to something the person said, it doesn't belong.
4. **Capture everything, publish selectively.** All material is kept; not all material is posted. Noggin applies judgement about what to express and when, including a privacy pass (would they tell a friendly stranger in the pub?) and safety handling for hard stories. Anything involving another person is off the board by default.
5. **Plain English.** No marketing jargon reaches the user. Visible, trustworthy, credible instead of top, middle, bottom. Every recommendation answers "why this, why now?"
6. **Noggin never brags about AI.** AI is present in capability and invisible in chrome and copy.
7. **The brain belongs to the person.** Always, including on a team plan. A business can see coverage and shared themes; it cannot read, edit or export an individual's brain. When someone leaves, their brain goes with them.

---

## 4. The core loop

**Deep dive → Brain → Studio → Post → Learn**, then round again every week.

The deep dive produces the first brain. The brain is the asset. Studio reads the brain and the person's goal and says what's worth writing this week, and why. The person writes. What they post feeds back into the brain (this lane has been used, this one has gone quiet) and into Insights (this is working, do more of it). A weekly top-up question keeps the brain growing.

The subscription is justified by this loop, not by onboarding. The deep dive is the wow moment; the loop is the retention engine.

---

## 5. Structure

Four destinations: **Home, Brain, Studio, Insights.** Two flows outside the nav: the deep dive (onboarding) and the weekly top-up. On team plans, a fifth destination: **Team.**

### 5.1 Home

The calmest screen and the habit anchor. One hero action: capture ("Tell me something", voice or text). One nudge: this week's suggestion from Studio, or the region of the brain that has gone quiet. No metrics.

### 5.2 The deep dive (flow, not destination)

The activation moment. Twelve questions in three sittings, voice first, typing available. Roughly thirty minutes in total, spread over three days by default or done in one evening.

| Sitting | Collects | Feeds |
|---|---|---|
| **Your story** (5) | What they loved as a kid; the moment it started; the before and the leaving; the accident that decided things; the hardest moment | Whys, Stories |
| **What you think** (4) | One person they helped and what that person said; what their industry gets wrong; what they say over and over; the belief they haven't said publicly yet | Whys, Opinions, Headline |
| **You, and proof** (3) | Off duty (where from, where now, who's at home); the running joke or surprising fact; numbers and kept messages | Personality, Receipts |

Behaviour, carried over from the live methodology and built into the questions themselves because there is no consultant in the room:

- **One question per screen.** Never a form.
- **Two beats.** Most questions have a second beat that only appears after the first answer: the scene prompt ("where were you, who said what?"), the gush prompt ("you lit up there, keep going"), or the contradiction prompt. Fixed copy in v1; AI chooses between them later.
- **Thin-answer nudge.** A voice note under forty seconds or a typed answer under sixty words gets one line asking for the scene. Never blocking.
- **"We'd keep this."** After each answer, two or three of their own lines shown back. People keep going when they see their own words looking good.
- **The safety line.** The hardest-moment question always carries it: nothing from this goes anywhere unless you decide it should.
- **The privacy pass.** End of sitting three: every person or situation they mentioned, listed, a toggle each, all off by default.

The brain is the progress indicator: it starts as an outline and each sitting lights its regions. Studio stays locked until the deep dive is complete and the walkthrough approved. After sitting two, one draft is allowed, labelled "from half a brain", as a taste.

**The walkthrough.** After sitting three: the full brain, every proposed card laid out for keep / edit / remove, then three proposals with evidence quoted from their own answers:

- **How you naturally talk** (storyteller, teacher, commentator, documenter; primary and secondary), diagnosed from *how* they answered, not asked
- **Your mix** of visible / trustworthy / credible, chosen from their goal: growing an audience, established and selling, full with clients, launching something
- **Your line**: who you help, what problem you solve, who you are. Three options; they pick or edit. Goes on their LinkedIn headline.

**Top-ups.** After approval, one more question a week from the longer bank, on Home. Answering it adds a card and lights a region. This replaces the long onboarding and keeps the brain compounding.

### 5.3 Brain

The product's centre and its defensibility. One destination, two views.

**The map.** A side-view brain drawn as a scatter of dots: no outlines, no labels on the drawing. Seven regions, each its own colour: Whys, Stories, Opinions, Personality, Receipts, Engine, Headline. Dot density follows use; a region posted from recently is dense, one neglected thins out, the quietest shows a faint ghost. Dots gather toward the cursor on hover. Tap a region and its cards slide in. The map is the one dark screen in the product (DESIGN.md 2.6): warm points of light on a deep surface. A new capture flies in as a dot.

**The board.** The same brain as an editorial page, magazine-profile style: Tanker names each story, Bespoke tells it, verbatim lines in the full voice treatment, constructed lines visibly plain with their sign-off state. Every element can show where it came from. This is what someone would show a co-founder or a new hire to explain who they are.

**Cards.** The atomic unit. One story, opinion, why, receipt or piece of furniture, in the person's words, with: kind, region, source, verbatim flag, angles (for stories and opinions), keywords, whether it's a lane posts can be filed under, privacy state, and which of visible / trustworthy / credible it usually serves.

**Capture.** "Tell me something", voice or text, from anywhere. A ninety-second voice note about a client call might become one story, two opinions and a lesson, each stored separately, with one follow-up asked at capture time. No post is generated. Photos can be captured too and tagged to a card; Studio surfaces them when that lane is in play.

**The brain evolves.** Noggin notices drift between the board and what the person keeps capturing and occasionally proposes an update ("eleven of your recent captures are about hiring; should it become a lane?"). The deep dive result is a starting point, never a permanent strategy.

### 5.4 Studio

Answers one question: **what's worth saying this week?**

Three recommendations, each with: the subject, which of visible / trustworthy / credible it serves and why that's what they need now, why now (region gone quiet, an event coming, a gap in the mix), which cards it draws on, a possible angle, two coaching questions to open it up, and a suggested shape (story, lesson, list, question).

After choosing, a quiet editor: no AI chrome, nothing between them and the words. On the side, a small brain lighting up the lanes the draft touches, the cards it's drawing from, which outcome it reads as, and a voice check that flags lines that don't sound like their cards (phrasing they've never used; LinkedIn clichés). Help is four buttons, all working only from approved cards, every result marked constructed until kept: tighten this, opening lines from this card, angles on this story, questions to go deeper. A post can't be marked as posted while a constructed line remains.

Cadence and mix live here, set from the person's goal and explained plainly: posts that find people, posts that convince them, posts that give them a reason to get in touch. The mix shifts with their situation and Noggin manages the shift.

A simple calendar: planned and posted, plus the person's own events ("speaking at X on the 14th") so Studio can nudge ("event in nine days, nothing drafted").

### 5.5 Insights

Two things, paired so there's a reason to open it weekly before any analytics integration exists.

1. **Their numbers in plain English.** They upload their LinkedIn export; Noggin turns it into sentences, each with a "so do this". Brand health over vanity: clarity, consistency, humanity, authority, commercial relevance. Lane usage over time, so they can see they've been all stories and no proof. Never a wall of metrics; never more than a handful of figures on screen. A one-page report export, for anyone who has to justify the subscription to a board or a boss.
2. **The feed.** LinkedIn changes translated as change → what it means → what you should do, each tagged with evidence confidence (confirmed by LinkedIn, strong third-party evidence, observed, hypothesis). Editorially produced, fortnightly. Never scrapes LinkedIn.

### 5.6 Team (team plans only)

One shared narrative, several real voices. A business sets its themes (what the company should be known for); each person keeps their own brain and voice. The team view shows **coverage, not content**: which themes are being spoken about by whom, which are quiet, who hasn't posted, which outcome the team's mix is weighted toward. A manager can suggest a theme for the week; they cannot see inside a brain or draft for anyone. Nothing in Team breaks non-negotiable 7.

### 5.7 The assistant (overlay, later)

A persistent "ask me anything" trained on the methodology and the person's own brain, available everywhere. Same rules: it advises, it does not write posts.

### 5.8 Community (later, not v1)

Comments on feed items, member-submitted tips, and an opt-in public "show your brain" page: a trimmed view of someone's regions as a profile. The forum seed. Not before Stage 5.

---

## 6. Build order

### Stage 1: Deep dive + Brain board
The twelve-question deep dive, the walkthrough, the board. A working prototype of the eight-question version exists; this stage upgrades it to the three-sitting structure and the walkthrough. The gate: if a person finishes the deep dive and the board genuinely feels like them, the core idea is proven. If not, nothing else gets built.

### Stage 2: Brain map + capture
The dot brain on the dark surface with hover and selection; "Tell me something" capture with extraction into cards; the weekly top-up; photos as a card type.

### Stage 3: Studio
Three weekly recommendations with reasoning, the quiet editor with lane detection and the voice check, the four help actions with constructed-line marking, the simple calendar with events.

### Stage 4: Strategy + Insights
Cadence, mix and coverage making Studio strategic rather than just relevant. The feed joins Insights (cheap to run, editorially produced). Payments: Solo tier live.

### Stage 5: Learning
Export upload, plain-English numbers, the report, and performance feeding back into recommendations and brain-evolution suggestions.

### Stage 6: Team
Shared themes, coverage view, team plans. Only once Solo has paying strangers who come back.

### Explicitly not in v1
- LinkedIn posting, scheduling or analytics API integration (section 8)
- Outreach features
- Agency tier
- Native mobile app, CRM features, automated commenting, lead-gen automation, custom ML models
- Community

---

## 7. Business model

- **Solo, around £19/month.** One brain: deep dive, brain, studio, insights, top-ups. Founding rate for former Expert Voice clients, who are the first cohort.
- **Team, around £129/month.** Up to five brains under one business with shared themes and the coverage view. Each person keeps their own brain. Built at Stage 6.
- **Guided, later.** Solo plus a monthly review call with a real coach. The productised version of the current done-with-you service; a margin line, not the main product.

Positioning: the methodology of a done-for-you personal branding service at a fraction of the cost, with human authorship preserved. Marketing leads with the refusal: other tools generate content; this one helps you discover what you actually have to say. Secondary message, for the founder buyer: a personal brand is business strategy, and the person is the only part competitors can't copy.

The moat is methodology plus memory. Every capture, post and top-up deepens the brain and raises the switching cost. Nobody wants to re-record forty voice notes somewhere else.

---

## 8. LinkedIn integration (deferred, planned)

- All future integration is OAuth-compliant through official APIs only. No cookie-based authentication, no browser-extension automation, no scraping, ever. LinkedIn restricts accounts using such tools, and compliance is a trust selling point.
- Posting on the person's own behalf uses the self-serve `w_member_social` permission when it comes. There is no native scheduling in the API; any queue is product-side.
- Post analytics come via LinkedIn's member analytics APIs, which require approval as a registered entity. Applied for once Stage 3 is stable; nothing in v1 depends on it. Until then, the export upload is the analytics path.
- Outreach features, if they ever come, only advise on who is worth talking to and why. They never send, automate or act on the person's behalf.

---

## 9. Technical shape

Deliberately boring; the differentiation is methodology, memory and the brain.

- Next.js 15 / TypeScript / Tailwind, Supabase (Postgres, Auth, Storage, Row Level Security), pgvector for brain retrieval, Anthropic API for follow-ups, extraction, recommendations and the four help actions, Whisper or Deepgram for transcription, Resend for the digest, Stripe for plans, Vercel hosting.
- AI functions look like: `suggestSecondBeat()`, `extractCards()`, `diagnoseEngine()`, `proposeHeadlines()`, `findRelatedCards()`, `spotBrainGap()`, `recommendThisWeek()`, `tightenDraft()`, `openingLinesFrom(card)`. There is no `writeLinkedInPost()`.
- Core objects: Person, Brain, Card (region, kind, source, verbatim, angles, keywords, isLane, privacy, outcome), Post (lanes, outcome, constructed ranges), Recommendation, Event, Photo, AnalyticsSnapshot, StrategyState, and on team plans Business and Theme.
- Voice capture is first-class: recording, transcription, and the transcript stored verbatim alongside anything extracted from it.
- Every AI call is logged with the job name, the card ids it used, and whether the output was kept, edited or discarded. That log is how prompts get better.

---

## 10. How to work with this file

1. Read this file before any feature work; read DESIGN.md before any UI work.
2. Section 3 outranks everything, including user requests routed through the product ("just write it for me" gets a coaching response, not a post).
3. When scope is ambiguous, build the smaller version and flag the gap.
4. The stage gates in section 6 are real: do not start a stage while the previous one's gate is unproven.
5. The user never meets the words funnel, top, middle or bottom. Visible, trustworthy, credible, always.
