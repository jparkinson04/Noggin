-- Noggin: a log of every AI call, as docs/04-ai-rules.md asks. It's how we find out which prompts
-- need work. Mirrors src/db/schema.ts.

create table ai_calls (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  -- extract | follow_up | draft_help
  job text not null,
  model text not null,
  -- The answer or card ids the call read, and the card ids it proposed.
  input_ids jsonb not null default '[]'::jsonb,
  output_ids jsonb not null default '[]'::jsonb,
  input_tokens int,
  output_tokens int,
  -- Filled in later: kept | edited | discarded.
  outcome text,
  error text,
  created_at timestamptz not null default now()
);

alter table ai_calls enable row level security;
create policy "own ai calls" on ai_calls for all using (brain_id in (select id from brains where owner_id = auth.uid()));
