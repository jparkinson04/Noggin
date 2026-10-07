-- Noggin: initial schema. Mirrors src/db/schema.ts. Apply in the Supabase SQL editor or via drizzle-kit.

create type region_key as enum ('whys','stories','opinions','personality','receipts','engine','headline');
create type engine as enum ('storyteller','teacher','commentator','documenter');
create type goal as enum ('growing_audience','established_selling','full_with_clients','launching');
create type funnel_level as enum ('top','middle','bottom');
create type deep_dive_status as enum ('not_started','in_progress','assembled','approved');
create type medium as enum ('voice','text','file','photo');
create type post_status as enum ('draft','scheduled','posted');
create type card_kind as enum ('why_internal','why_external','why_philosophical','story','opinion','opinion_reserve','furniture','signature','receipt_number','receipt_quote','receipt_win');
create type privacy as enum ('on_board','off_board');

create table brains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null,
  goal goal,
  engine_primary engine,
  engine_secondary engine,
  mix_top int default 50,
  mix_middle int default 40,
  mix_bottom int default 10,
  cadence_per_week int default 3,
  headline text,
  headline_options jsonb default '[]'::jsonb,
  deep_dive_status deep_dive_status not null default 'not_started',
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  version int not null default 1,
  part int not null,
  position int not null,
  text text not null,
  listening_for text,
  follow_up_hint text,
  safety_line text,
  region region_key not null
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  question_id uuid not null references questions(id),
  medium medium not null,
  audio_url text,
  transcript text,
  typed_text text,
  follow_up_question text,
  follow_up_answer text,
  recorded_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  region_key region_key not null,
  kind card_kind not null,
  title text not null,
  body text not null,
  source_answer_id uuid references answers(id),
  angles jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  is_lane boolean not null default false,
  constructed boolean not null default false,
  privacy privacy not null default 'on_board',
  funnel_default funnel_level not null default 'middle',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  status post_status not null default 'draft',
  body text not null,
  funnel_level funnel_level,
  lane_card_ids jsonb not null default '[]'::jsonb,
  constructed_lines jsonb not null default '[]'::jsonb,
  posted_at date,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brain_dumps (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  medium medium not null,
  audio_url text,
  transcript text,
  text text,
  promoted_to_card_id uuid references cards(id),
  promoted_to_post_id uuid references posts(id),
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  storage_url text not null,
  caption text,
  card_ids jsonb not null default '[]'::jsonb,
  uploaded_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  title text not null,
  date date not null,
  notes text
);

create table feed_items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  kind text not null,
  title text not null,
  body text not null,
  published_at timestamptz not null default now()
);

create table analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  brain_id uuid not null references brains(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  impressions int,
  engagements int,
  followers int,
  profile_views int,
  notes text,
  source text not null default 'manual'
);

-- Row level security: people see only their own brain and everything under it.
alter table brains enable row level security;
alter table answers enable row level security;
alter table cards enable row level security;
alter table posts enable row level security;
alter table brain_dumps enable row level security;
alter table photos enable row level security;
alter table events enable row level security;
alter table analytics_snapshots enable row level security;

create policy "own brain" on brains for all using (owner_id = auth.uid());
create policy "own answers" on answers for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own cards" on cards for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own posts" on posts for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own dumps" on brain_dumps for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own photos" on photos for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own events" on events for all using (brain_id in (select id from brains where owner_id = auth.uid()));
create policy "own analytics" on analytics_snapshots for all using (brain_id in (select id from brains where owner_id = auth.uid()));

-- Questions and feed items are readable by everyone signed in.
alter table questions enable row level security;
create policy "read questions" on questions for select using (auth.role() = 'authenticated');
alter table feed_items enable row level security;
create policy "read feed" on feed_items for select using (auth.role() = 'authenticated');

-- Storage buckets to create in the dashboard: voice-notes (private), photos (private).
