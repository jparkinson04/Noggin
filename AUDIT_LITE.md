# Noggin lite profile audit spec

27 October 2026

## What it is

A free profile audit on heynoggin.com: paste your LinkedIn headline and About, get a score out of 100 built from six checks, and see the one fix that matters most. Its job is to collect waitlist emails and give people a reason to send the link to someone else.

It is the lite version of the profile module that will live inside Noggin. The full version scores the profile against the person's own Board (who they are for, what they offer, which engine they run on), audits Featured and recent posts, and rewrites the headline and About in their own words. The lite version holds all of that back and says so.

Hard constraints:

- No LinkedIn login, no scraping, no fetching linkedin.com URLs. The visitor pastes text. Nothing else touches LinkedIn.
- No new visual styles. Build inside the existing heynoggin.com look (the dark ground, the purple brain, the current type). The audit is a section of the site, not a new site.
- Copy voice is the Noggin voice (section 7). It never sounds like a sales funnel.
- The lite audit never rewrites anything. It diagnoses and explains; the rewrite is the reason to join the waitlist.

## Input

Three fields, one screen, no account.

| Field | Label | Help text | Required |
| --- | --- | --- | --- |
| Headline | Your headline | The line under your name on LinkedIn. Copy it in as it is. | Yes |
| About | Your About section | Paste the whole thing, even if it's long. | Yes |
| Audience | Who do you want to reach? | One line. For example: founders of 10 to 50 person agencies. | No |

The audience line is what makes this better than a generic checker. Two of the six checks score the headline and About against the audience the person typed, not against a rule of thumb. If they leave it blank, those checks still run and the fix copy asks them to name their reader.

Button: Score my profile. Loading line: Reading your profile the way a stranger would. The result appears on the same page, below the form.

## The six checks

Six checks, two per score. The three scores are the three words Noggin already promises: visible, credible, trustworthy. Each check lands in one of three states: fix found (0), partly working (50), working (100).

**Visible: can the right person tell you're for them?**

| Check | What it looks at | Working (100) | Partly working (50) | Fix found (0) |
| --- | --- | --- | --- | --- |
| 1. Headline names the reader | Headline against the audience line | Names who it's for in plain words that match the audience line | Hints at an audience (an industry, a job title) but a stranger would have to guess | Says what you do or your job title and nothing about who it's for |
| 2. About opens with the reader | The first two sentences of About, which is all LinkedIn shows before "see more" | A stranger knows what you do and for whom from the first two sentences | The first two sentences say what you do but not for whom, or the other way round | Opens with background, history, a quote or a story. The useful bit is buried further down |

**Credible: is there a reason to believe you?**

| Check | What it looks at | Working (100) | Partly working (50) | Fix found (0) |
| --- | --- | --- | --- | --- |
| 3. Proof you can point at | The whole About | At least one concrete number, named result or named client | A claim of results with no number or name attached ("helped hundreds of businesses") | No proof of any kind |
| 4. Sounds like a person | Headline and About together | First person, specific, no filler. Reads like someone talking | Some filler or a keyword list, but a person is in there somewhere | Filler words and stacked keywords (passionate, results-driven, leverage, pipes and emoji lists). Could be anyone |

**Trustworthy: does it hold together and lead somewhere?**

| Check | What it looks at | Working (100) | Partly working (50) | Fix found (0) |
| --- | --- | --- | --- | --- |
| 5. One promise, not two | Headline against About | The headline and the About describe the same person doing the same thing for the same people | They overlap but the About widens or drifts (two offers, two audiences) | The headline and the About could be two different people |
| 6. A next step | The end of About | Says what to do next and how (message me about X, book here, email me) | Mentions how to get in touch but not why or for what | Ends with nothing. The reader agrees with you and has nothing to do about it |

Filler list for check 4, used as a deterministic pre-pass before the model scores it: passionate, results-driven, seamless, leverage, empower, unlock, synergy, thought leader, visionary, guru, ninja, rockstar, go-to, helping businesses grow, dynamic, innovative, cutting-edge. Three or more in headline plus About caps check 4 at partly working.

## Scoring

Each check is 0, 50 or 100. A score is the mean of its two checks. The overall is the mean of the three scores, rounded to a whole number. Nothing is weighted; it keeps the maths explainable in one sentence on the page ("built from six checks, two per score").

The biggest fix is the lowest-scoring check. On a tie, the order is 1, 2, 6, 3, 5, 4: being findable and giving people a next step beat polish.

For every check the model returns four things:

1. `state`: `fix` | `partly` | `working`
2. `evidence`: the exact words from the profile that decided it, quoted back (up to 20 words), so the person sees it was read, not guessed at
3. `why`: one sentence on what this costs them
4. `fix`: one or two sentences on what to change, without writing it for them

The overall score line uses the person's first name if it's obvious from the headline, otherwise "Your profile scored 61 out of 100." Keep it to one sentence.

## The results page

Top to bottom, on the same page as the form, scrolled into view when ready:

1. **The score line.** "Alfie, your profile scored 61 out of 100." Underneath, in small type: "Six checks, two per score. Read the way a stranger reads it."
2. **Three scores in a row.** Visible, Credible, Trustworthy, each out of 100. Three, never four. No progress bars, a number and a word each.
3. **The biggest fix.** One card, the lowest check, shown in full: evidence, why, fix. This is the thing they screenshot.
4. **The six checks.** Grouped under their score. Each row shows the check name, the state pill (fix found / partly working / working) and the evidence line. The `why` and `fix` are visible for the biggest fix and for any check marked working; for the other checks they sit behind the email.
5. **The email card.** "Save this and get the rest of the fixes." One field, one button. On submit the hidden fixes appear in place and the referral card shows.
6. **The hold-back line.** Plain text, after the checks: "This read your headline and About. Noggin reads your Featured section and your last 30 posts, scores them against who you're actually for, and rewrites the lot in your own words. It's on the waitlist."

State pills use three colours only, taken from the site's existing palette; if the site has no amber, add it as one token and flag it. No green ticks and no red crosses as icons, the word on the pill does the work.

What is free and what is behind the email:

| Element | Free | After email |
| --- | --- | --- |
| Overall and three scores | Yes | Yes |
| Six states with evidence | Yes | Yes |
| Biggest fix in full | Yes | Yes |
| Why and fix for the other five checks | Working checks only | All |
| Report saved to a link they can return to | No | Yes |
| Referral link and tiers | No | Yes |

## Email capture and referral tiers

The email joins the existing waitlist list, tagged `audit`, with the overall score and the six states stored against it. Every email gets a unique link, `heynoggin.com/audit?ref=<code>`, and a page they can return to for their report.

The referral card appears after the email is in:

"Know someone whose profile needs this? Send them your link. When they score theirs, you get:"

| People who score through your link | You get |
| --- | --- |
| 1 | The full why-and-fix for every check, unlocked now |
| 3 | A month of Noggin free when it launches |
| 10 | Founding rate, locked for life |

Tier 1 must be something that exists today, which is why it's the remaining fixes rather than a guide. Tiers 2 and 3 are promises against launch, which the waitlist is already making. Decide whether the content engine quiz result pack should replace tier 1 before this ships.

Under the tiers, a message they can copy with one tap:

"I just scored my LinkedIn profile on heynoggin.com. It reads your headline and About the way a stranger would and tells you the one thing to fix first. Took me two minutes. Yours is here: heynoggin.com/audit?ref=<code>"

A referral counts when the referred person submits an email, not when they land. Gifts are sent by the same email service as the waitlist confirmation, automatically.

## Copy voice and fix-writing rules

The site rules apply to every word, including what the model writes:

- British English, sentence case everywhere, including pills and buttons.
- Warm, plain, direct. Contractions are fine. No corporate filler, no "simply", no "just".
- No em dashes. No "it's not X, it's Y" constructions.
- Never mention AI. The audit "reads" the profile; nothing "analyses" or "uses AI". No sparkle icons.
- No fear and no hype. The tone is a friend who knows LinkedIn well telling you what they noticed.

Rules for the `why` and `fix` text the model returns:

1. Quote their words back before judging them. Evidence first, verdict second.
2. `why` is one sentence about the reader, not about the algorithm. "A founder scanning your headline can't tell you work with people like her" beats "LinkedIn's algorithm needs keywords".
3. `fix` says what to change and what good looks like, in the shape of an instruction, never a draft. "Open your About with who you help and what changes for them" is fine. "Try: I help agency founders win bigger clients" is not; that is a rewrite and it's held back.
4. Two sentences maximum for `fix`. If it needs more, the check is too broad.
5. When the audience line is blank, checks 1 and 2 say so: "You didn't tell us who you're for, and neither does your headline."
6. No exclamation marks, no "great news", no "unfortunately".

Worked example of a check 2 result on a weak About:

> Evidence: "I started my career in 2009 as a junior account exec at…"
> Fix found. Your About opens with your history, so a stranger reads two sentences about 2009 and still doesn't know what you do for them now. Lead with who you help and what changes for them, then put the history where people who already care will find it.

## Build notes

- **Where it lives.** A route on the existing heynoggin.com Next.js app at `/audit`, linked from the landing page as the free tool. Same components, same tokens, nothing new.
- **Scoring.** One server-side call to the Anthropic API per submission, with the six rubrics from section 3 in the system prompt and a JSON schema for the response (six objects of `state`, `evidence`, `why`, `fix`). Run the filler-word pre-pass in code before the call and pass its result in, so check 4 can't be talked out of it. Compute the three scores, the overall and the biggest fix in code, never in the model.
- **Model.** Use the cheapest model that passes the test set below; this runs on every submission and most will never convert.
- **Test set before shipping.** Ten real-shaped profiles: three strong, four middling, three weak, including one with a blank audience line and one keyword-stuffed headline. Each check must land where a person would put it on at least eight of ten. Hand-write the expected states first, then run.
- **Storage.** Until an email is given, keep nothing beyond the request. After an email, store email, referral code, overall, six states and the pasted text, against the waitlist record, so the report page can be rebuilt. Say this in one line under the form: "We keep nothing unless you give us your email."
- **Abuse.** Rate limit by IP (five scores an hour is plenty) and cap inputs at 300 characters for the headline and 3,000 for About, which matches LinkedIn's own limits.
- **Referrals.** The code is the first eight characters of a hash of the email. Count a referral on email submit. Tier emails go through the waitlist's existing sender.
- **Held back for the app, do not build here:** Featured and post checks, cluster analysis from the data export, AI visibility checks, any rewriting, any scoring against a Board. These are the full profile module and they wait for the developer's backend.
- **The developer.** This is pure front end plus one API route; it doesn't need the Supabase work. Build it independently so it ships before the backend does.

## Design reference

`audit-preview.html` in the repo root is the approved layout for the page: section order, copy, states (locked and unlocked) and the referral card. Match its structure. Build it from the site's own components, tokens and fonts, not the preview's inline CSS; where the preview's colours or type differ from the site, the site wins.
