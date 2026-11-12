-- Noggin: the deep dive saves as people go. One answer row per question, voice notes in Storage.
-- Mirrors src/db/schema.ts.

-- The bank is edited in src/lib/brain/questions.ts and copied here by `npm run db:questions`.
-- `key` is the id there (s1_2, top_3). Top-ups sit outside the three sittings, so `part` can be empty.
alter table questions add column key text constraint questions_key_unique unique;
alter table questions alter column part drop not null;

-- One brain per person for now. Teams will widen this to one per person per business.
alter table brains add constraint brains_one_per_owner unique (owner_id);

-- Saving again updates the same row. Voice notes, in the order they were recorded:
-- [{ "path": "<user id>/<question key>/<file>", "seconds": 42.5 }]. follow_up_* is the second beat.
alter table answers
  add constraint answers_one_per_question unique (brain_id, question_id),
  add column clips jsonb not null default '[]'::jsonb,
  add column follow_up_clips jsonb not null default '[]'::jsonb;

-- Both buckets are private. Made here so a fresh project gets them too.
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false), ('photos', 'photos', false)
on conflict (id) do nothing;

-- People read, add and remove only their own voice notes: the first folder is their user id.
create policy "own voice notes read" on storage.objects for select to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own voice notes upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own voice notes delete" on storage.objects for delete to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
