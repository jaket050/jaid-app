-- Learner answers for JAID: one 'answer_submitted' event per answer, plus the
-- game mode on card_game_pair_flipped.
-- Apply manually in the Supabase SQL editor. Safe to run more than once.
--
-- event_type is plain text with no CHECK constraint or enum (see
-- 0001_create_learner_events.sql), so the new type needs no change to it.
--
-- New nullable columns (existing rows and events leave them empty):
--   mode      the practice mode: study, quiz, kinship, weather, food,
--             antonyms, anatomy or municipality
--   correct   true for a right answer, false for a wrong one
--   item_key  an answer that is not a vocabulary row, such as a
--             municipality id ('hagatna'); vocabulary answers use word_id
--
-- Row Level Security is unchanged: the anonymous key may only INSERT, and
-- there is still no SELECT, UPDATE or DELETE access. The existing table level
-- INSERT grant to anon covers the new columns.

alter table learner_events add column if not exists mode text;
alter table learner_events add column if not exists correct boolean;
alter table learner_events add column if not exists item_key text;
