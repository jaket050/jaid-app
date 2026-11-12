-- Migration: vocabulary_alternate_chamoru
-- Apply in: Supabase Dashboard → SQL Editor → Run
--
-- Adds a nullable column for the "Alternate Usages" printed beside a main
-- form in the Kumision tables (e.g. Position Titles). Stored verbatim, slashes
-- and suffix shorthand included. Not used for Numbers: Ansiånu and Prisente
-- are separate number systems stored as separate rows.

ALTER TABLE public.vocabulary
  ADD COLUMN IF NOT EXISTS alternate_chamoru TEXT;
