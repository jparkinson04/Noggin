-- Noggin: LinkedIn connections and the publishing queue. Mirrors src/db/schema.ts.
-- LinkedIn's API has no scheduling, so Noggin keeps its own queue and a worker publishes when due.

create type scheduled_post_status as enum ('scheduled','publishing','published','failed','cancelled');

-- One LinkedIn account per user. The token lasts 60 days and cannot be refreshed in the background.
create table linkedin_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  linkedin_member_urn text not null,
  display_name text not null,
  avatar_url text,
  scopes text[] not null default '{}',
  -- Encrypted with TOKEN_ENCRYPTION_KEY before it gets here. Only the service role reads it.
  access_token_encrypted text,
  token_expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_post_id uuid references posts(id) on delete set null,
  body text not null,
  media jsonb not null default '[]'::jsonb,
  scheduled_for timestamptz not null,
  timezone text not null default 'Europe/London',
  status scheduled_post_status not null default 'scheduled',
  linkedin_post_urn text,
  linkedin_post_url text,
  error_code text,
  error_message text,
  attempts int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_posts_body_length check (char_length(body) <= 3000)
);

create index scheduled_posts_due on scheduled_posts (status, scheduled_for);

-- Row level security.
alter table linkedin_connections enable row level security;
alter table scheduled_posts enable row level security;

-- People manage their own queue in full.
create policy "own scheduled posts" on scheduled_posts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- People can see their own connection, but never the token: column grants keep
-- access_token_encrypted out of reach of the anon and authenticated roles.
create policy "own connection" on linkedin_connections for select using (user_id = auth.uid());
create policy "disconnect own" on linkedin_connections for delete using (user_id = auth.uid());
revoke all on linkedin_connections from anon, authenticated;
grant select (id, user_id, linkedin_member_urn, display_name, avatar_url, scopes, token_expires_at, connected_at, updated_at)
  on linkedin_connections to authenticated;
grant delete on linkedin_connections to authenticated;

-- A view with the safe columns only, for the browser.
create view linkedin_connection_public with (security_invoker = true) as
  select id, user_id, linkedin_member_urn, display_name, avatar_url, scopes, token_expires_at, connected_at, updated_at
  from linkedin_connections;
grant select on linkedin_connection_public to authenticated;

-- Keep updated_at honest.
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger linkedin_connections_touch before update on linkedin_connections for each row execute function touch_updated_at();
create trigger scheduled_posts_touch before update on scheduled_posts for each row execute function touch_updated_at();

-- The worker claims due posts atomically so nothing publishes twice. Service role only.
create or replace function claim_due_scheduled_posts(batch int default 20)
returns setof scheduled_posts language sql security definer as $$
  update scheduled_posts
  set status = 'publishing', updated_at = now()
  where id in (
    select id from scheduled_posts
    where status = 'scheduled' and scheduled_for <= now()
    order by scheduled_for
    limit batch
    for update skip locked
  )
  returning *;
$$;
revoke all on function claim_due_scheduled_posts(int) from public, anon, authenticated;
