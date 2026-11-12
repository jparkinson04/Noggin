-- Noggin: who the person wants to reach, and audits of who is actually reacting to their posts.
-- Mirrors src/db/schema.ts.

-- Who they want to reach and what they want from them, in their own words. Every audit is read
-- against these two lines.
alter table brains
  add column ideal_client text,
  add column audience_goal text;

-- One audit: the person uploaded screenshots of who reacted to their recent posts (or pasted the
-- list), and each person on it was sorted against the ideal client. The screenshots themselves
-- are never stored. Nothing here is fetched from LinkedIn.
create table audience_audits (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  -- What it was read against at the time, so an old audit still makes sense after they change it.
  ideal_client text not null,
  audience_goal text,
  -- [{ "name": "...", "headline": "...", "group": "ideal|adjacent|peer|other", "why": "..." }]
  -- Other people's names and headlines: kept only so the person can see who to talk to, and
  -- deleted with the audit.
  people jsonb not null default '[]'::jsonb,
  summary text not null default '',
  -- [{ "title": "...", "body": "..." }]
  tips jsonb not null default '[]'::jsonb,
  screenshots int not null default 0,
  model text,
  created_at timestamptz not null default now()
);
create index audience_audits_latest on audience_audits (brain_id, created_at desc);

alter table audience_audits enable row level security;
create policy "own audience audits" on audience_audits for all
  using (brain_id in (select id from brains where owner_id = auth.uid()))
  with check (brain_id in (select id from brains where owner_id = auth.uid()));
