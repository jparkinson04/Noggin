-- Noggin: the rest of what the Board edits, so a brain survives a reload. Mirrors src/db/schema.ts.

-- The engine quiz's result, kept whole (blend, situation, mix, cadence, flag, when it was taken),
-- and the engine the person chose on the Board over what their answers showed:
-- { "primary": "teacher", "secondary": "storyteller", "at": "2026-10-25" }.
alter table brains
  add column quiz jsonb,
  add column engine_override jsonb;
