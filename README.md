# Noggin (working name)

A personal-brand brain for LinkedIn. People answer a deep dive about themselves (by voice, ideally), the app shapes those answers into a brain board, and from then on every post they draft is checked against that brain: which lanes it touches, which have gone quiet, and whether it sounds like them.

Built from the Expert Voice deep-dive process. The process is the product; the software just removes the consultant from the loop without removing the rigour.

## Start here

1. `docs/01-product.md` — what this is, who it's for, the modules, the user journey
2. `docs/02-data-model.md` — the brain, its regions, cards, posts, usage tracking
3. `docs/03-design-system.md` — the look, the tokens, the brain visual, what to avoid
4. `docs/04-ai-rules.md` — exactly what AI is and isn't allowed to do in this product
5. `docs/05-roadmap.md` — build order, phase by phase
6. `docs/06-naming.md` — name candidates and the criteria

`CLAUDE.md` is the brief Claude Code reads on every session. Keep it current.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys when you get to phase 2
npm run dev
```

Phase 1 runs entirely on sample data (`src/lib/brain/sampleBrain.ts`) with no backend, so you can design and iterate on the brain visual and the post studio before any database exists.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (tokens live in `src/app/globals.css`)
- Supabase: Postgres, Auth, Storage (voice notes, photo bank)
- Drizzle ORM (`src/db/schema.ts`), SQL migrations in `supabase/migrations/`
- Anthropic API for the three allowed AI jobs (see `docs/04-ai-rules.md`)
- Transcription: Whisper or Deepgram behind `src/app/api/transcribe/route.ts`

## Rename

The working name is Noggin. To rename: search-and-replace `Noggin`/`noggin` across the repo, update `package.json` name, and `docs/06-naming.md`.
