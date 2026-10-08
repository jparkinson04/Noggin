-- Noggin: settings, and the profile fields that live on the brain. Mirrors src/db/schema.ts.

-- Profile. The brain already carries owner_name; these sit beside it rather than in a new table.
alter table brains
  add column first_name text,
  add column last_name text,
  add column job_title text,
  add column company text,
  add column avatar_url text;

create type spelling as enum ('uk','us');
create type emoji_level as enum ('none','sparingly','happy');
create type hashtag_level as enum ('none','up_to_3');
create type post_length as enum ('short','medium','long');
create type anonymise_others as enum ('always','ask');

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/London',
  spelling spelling not null default 'uk',
  banned_phrases text[] not null default '{}',
  no_em_dashes boolean not null default false,
  -- The brain has no phrase store (signature cards are stories, not phrases), so these live here.
  signature_phrases text[] not null default '{}',
  emoji_level emoji_level not null default 'none',
  hashtag_level hashtag_level not null default 'none',
  default_post_length post_length not null default 'medium',
  -- topic key → 'share' | 'ask' | 'never'. Custom topics are keys too.
  sharing jsonb not null default '{"family":"ask","health":"ask","money":"ask","failures":"share","client_names":"never","employer":"ask","politics":"never"}'::jsonb,
  anonymise_others anonymise_others not null default 'ask',
  -- [{ "day": 2, "time": "09:30" }], day 0 = Sunday, time in the person's timezone.
  posting_slots jsonb not null default '[]'::jsonb,
  weekly_post_goal int not null default 3 check (weekly_post_goal between 1 and 7),
  confirm_before_publish boolean not null default true,
  -- { "<key>": { "email": bool, "inApp": bool } } plus "nudgeAfterDays": 7 | 14 | 30
  notifications jsonb not null default '{"topUp":{"email":true,"inApp":true},"digest":{"email":false,"inApp":false},"postPublished":{"email":false,"inApp":true},"postFailed":{"email":true,"inApp":true},"connectionExpiring":{"email":true,"inApp":true},"nudge":{"email":true,"inApp":true},"nudgeAfterDays":14}'::jsonb,
  keep_voice_recordings boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;
create policy "own settings select" on user_settings for select using (user_id = auth.uid());
create policy "own settings insert" on user_settings for insert with check (user_id = auth.uid());
create policy "own settings update" on user_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger user_settings_touch before update on user_settings for each row execute function touch_updated_at();

-- A row exists from the moment the account does; the app never assumes it, but this keeps reads simple.
create or replace function create_user_settings() returns trigger language plpgsql security definer as $$
begin
  insert into user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created_settings after insert on auth.users for each row execute function create_user_settings();
