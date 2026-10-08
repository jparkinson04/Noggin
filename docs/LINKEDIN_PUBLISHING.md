# LinkedIn publishing and scheduling — developer handover

This is the skeleton of publish-now and schedule-for-later to a person's own LinkedIn profile.
The UI, data model, module structure and the worker's control flow are done and work end to end
in **mock mode**. Nothing calls LinkedIn yet. Everything that needs the real API is a `TODO(dev)`
and listed below.

We use only the official API. No scraping, no cookies, no browser automation, ever.

## What's done

- **Migration** `supabase/migrations/0002_linkedin_publishing.sql`: `linkedin_connections`,
  `scheduled_posts`, the status enum, the `(status, scheduled_for)` index, the 3,000-character
  check, RLS, column grants that keep `access_token_encrypted` away from the browser, a
  `linkedin_connection_public` view, `updated_at` triggers and the atomic
  `claim_due_scheduled_posts(batch)` function. Mirrored in `src/db/schema.ts` (Drizzle).
- **Module** `src/lib/linkedin/`
  - `types.ts` — `LinkedInConnection`, `ScheduledPost`, `PostStatus`, `PublishResult`,
    `PublishError` with codes `TOKEN_EXPIRED | RATE_LIMITED | INVALID_CONTENT | MEDIA_UPLOAD_FAILED | UNKNOWN`.
  - `publisher.ts` — the `LinkedInPublisher` interface, `MockPublisher` (1s delay, fake URN/URL,
    fails when the body contains `[fail]`), `LinkedInApiPublisher` (every method throws
    `NotImplementedError`, with the exact endpoint in a comment), `getPublisher()` picks by
    `LINKEDIN_PUBLISHER=mock|live` (default mock).
  - `format.ts` — `escapeForLinkedIn()` for the Posts API "little text" format; `firstLine()`.
    Fully implemented and unit-tested.
  - `tokens.ts` — `isConnectionExpired`, `daysUntilExpiry`, `tokenCoversDate`, `isExpiringSoon`.
    Unit-tested.
  - `store.ts` — the `LinkedInStore` interface, `MemoryStore` (mock mode) and `SupabaseStore` (TODO).
  - `service.ts` — all the rules: schedule, reschedule, cancel, publish now, retry, and `runWorker()`.
- **API routes** under `src/app/api/linkedin/`: `connect`, `callback`, `connection` (GET/DELETE,
  and PATCH in mock mode to age the token), `posts` (GET/POST), `posts/[id]` (PATCH/DELETE),
  `posts/[id]/publish`, `posts/[id]/retry`, `worker`.
- **UI**
  - Studio → "Publish to LinkedIn" under a finished post: preview with name, avatar and live
    character count; Post now; Schedule with a local-time picker saved as UTC; connect prompt;
    the token-expiry warning with Reconnect.
  - Studio → **Scheduled** tab (`/studio/scheduled`): Upcoming / Published / Failed, with edit time,
    cancel, post now, retry and View on LinkedIn. Empty state.
  - Settings (`/settings`, the avatar in the rail): the connection card in its four states.
  - App-wide dismissible banner when the connection is expiring (≤ 7 days) or expired **and**
    scheduled posts are affected.
  - Home → "Next post" panel.
- Tests: `npm test` (`tsx --test`), 14 passing.

## Every TODO(dev), by file

| File | What's needed |
|---|---|
| `src/lib/linkedin/publisher.ts` → `LinkedInApiPublisher.publishTextPost` | `POST https://api.linkedin.com/rest/posts` with headers `Authorization: Bearer`, `LinkedIn-Version: YYYYMM`, `X-Restli-Protocol-Version: 2.0.0`; body `{ author, commentary, visibility: "PUBLIC", distribution, lifecycleState: "PUBLISHED" }`; read the URN from the `x-restli-id` header; map 401→`TOKEN_EXPIRED`, 429→`RATE_LIMITED`, 422→`INVALID_CONTENT`. |
| `publisher.ts` → `uploadImage` | `POST /rest/images?action=initializeUpload` with `{ initializeUploadRequest: { owner } }`, then `PUT` the bytes to the returned `uploadUrl`; keep the `urn:li:image:…`. |
| `publisher.ts` → `publishImagePost` | As text, plus `content: { media: { id: imageUrn, altText } }`. |
| `publisher.ts` → `getAuthUrl` | Confirm the scopes match the products on the app. |
| `src/lib/linkedin/store.ts` → `SupabaseStore` | Browser reads via the `linkedin_connection_public` view; token reads, upserts and `claimDuePosts` with the service role; `claimDuePosts` calls `claim_due_scheduled_posts(batch)`. |
| `src/lib/linkedin/service.ts` → `publishOne` | Decrypt `access_token_encrypted` with `TOKEN_ENCRYPTION_KEY` before calling the publisher. |
| `src/app/api/linkedin/connect/route.ts` | Live mode: random `state` in an httpOnly cookie, redirect to `getAuthUrl(state)` (written; verify). |
| `src/app/api/linkedin/callback/route.ts` | Check `state`; exchange the code at `https://www.linkedin.com/oauth/v2/accessToken`; `GET https://api.linkedin.com/v2/userinfo` for `sub`, `name`, `picture`; encrypt the token; upsert `linkedin_connections`; redirect to `/settings?connected=1`. |
| `src/app/api/linkedin/worker/route.ts` | Register the every-minute cron and protect the route with `CRON_SECRET`. |
| `src/lib/auth/currentUser.ts` | Replace the stub (always Maya) with the Supabase session user. |

## Setup checklist

1. Create a **LinkedIn Company Page** for the company. LinkedIn requires one to create a developer app.
2. Create the app at <https://developer.linkedin.com> and associate it with that page.
3. Under **Products**, add **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
   Both are self-serve; approval is automatic.
4. Under **Auth**, confirm the scopes `openid`, `profile`, `email`, `w_member_social` are available,
   and add the redirect URLs:
   - `http://localhost:3000/api/linkedin/callback`
   - `https://<production host>/api/linkedin/callback`
5. Copy the client ID and secret into the environment (below). Never commit them.
6. Run the migration (below) and implement `SupabaseStore`.
7. Set `LINKEDIN_PUBLISHER=live` on the server only once the callback and store are done.

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `LINKEDIN_PUBLISHER` | server | `mock` (default) or `live`. |
| `LINKEDIN_CLIENT_ID` | server | From the developer app. |
| `LINKEDIN_CLIENT_SECRET` | server | Never sent to the browser. |
| `LINKEDIN_REDIRECT_URI` | server | Must match the app's redirect URL exactly. |
| `TOKEN_ENCRYPTION_KEY` | server | 32 random bytes, base64. AES-256-GCM for tokens at rest. Never `NEXT_PUBLIC_`. |
| `CRON_SECRET` | server | Vercel sends it as `Authorization: Bearer …` to the worker. |

`.env.example` lists them. None of them is read in a client component.

## The migration

Apply `supabase/migrations/0002_linkedin_publishing.sql` in the Supabase SQL editor (or
`npm run db:push` once `DATABASE_URL` is set). It depends on `0001_init.sql` (the `posts` table and
`auth.users`). Notes:

- The browser role can `select` only the safe columns of `linkedin_connections`; the token column
  is not granted. Reads from the browser should use the `linkedin_connection_public` view.
- Inserts and updates on `linkedin_connections` are service-role only (no insert/update policy for
  authenticated).
- `claim_due_scheduled_posts(batch)` is `security definer` and revoked from `anon`/`authenticated`,
  so only the worker (service role) can claim.

## The worker

`runWorker()` in `service.ts` is the real control flow:

1. Claim due posts atomically: `UPDATE scheduled_posts SET status='publishing' WHERE status='scheduled'
   AND scheduled_for <= now() … RETURNING` (with `FOR UPDATE SKIP LOCKED` in the SQL function). This is
   what stops a post publishing twice if two workers overlap.
2. For each post: no connection or expired token → `failed` with `TOKEN_EXPIRED`. Otherwise publish
   through the `LinkedInPublisher` → `published` (URN and URL saved) or `failed` (code, message,
   `attempts + 1`).

Registering it every minute, pick one:

- **Vercel cron**: add to `vercel.json`
  `{ "crons": [{ "path": "/api/linkedin/worker", "schedule": "* * * * *" }] }` and set `CRON_SECRET`.
  The route already checks the bearer header in live mode.
- **Supabase Edge Function on pg_cron**: port `runWorker()` (it only needs the store and publisher)
  and schedule it with `cron.schedule('linkedin-worker', '* * * * *', …)`.

In mock mode the Scheduled page calls the worker every 30 seconds while it's open, so due posts go
out without a cron.

## Known limits

- **Tokens last 60 days** on self-serve access and there is no refresh token in the background.
  The person must reconnect; the connection card, the scheduling warning and the banner all say so.
  Keep the warning threshold at 7 days (`EXPIRY_WARNING_DAYS`).
- **No analytics.** The self-serve tier can't read post statistics. That needs Community Management
  API partner approval, later. Nothing here reads anyone else's data.
- **Little-text escaping is required.** `\ | { } @ [ ] ( ) < > # * _ ~` must be backslash-escaped
  or LinkedIn rejects or mangles the post. `escapeForLinkedIn` does it; `publishOne` applies it
  once, just before the API call. Don't escape earlier or it will double up.
- **3,000 characters** per post. Enforced in the UI, the service and the database.
- **Memory store on serverless.** In mock mode state lives in the server process. Locally that's
  fine; on Vercel each instance has its own copy, so the demo can lose state between requests.

## Decisions made in this pass

- **Sign-off rule.** The brief says only a post the person has signed off in Studio can be published.
  Studio has no per-post sign-off state yet (posts have `draft | scheduled | posted` and the in-app
  post has no constructed-line ranges). The gate used is: the brain is approved **and** the draft
  carries no constructed lines, which is the only rule the product currently has. It is passed as
  `approved` to the service, which refuses with 403 otherwise. **Flagged**: decide whether Studio
  needs an explicit "Mark as signed off" step; if so the only change is what Studio passes.
- **`studio_post_id`** is nullable and `on delete set null`. Studio posts aren't persisted yet, so
  the UI passes `null` for now.
- **Settings** didn't exist. `/settings` was added with the connection card, reached from the
  avatar in the rail. No new nav item.
- **Mock-only controls** (age the token to "expiring in 5 days" / "expired" / "fresh") appear on the
  connection card only when the connection is a mock one, so the states can be tried without
  waiting 60 days.
- No new dependencies.
