-- Migration: antonym_pairs
-- Apply in: Supabase Dashboard → SQL Editor → Run
--
-- Creates the join table for Kumision-verified CHamoru antonym pairs.
-- No pair data is inserted here; rows are added through the admin workflow
-- after each pair is confirmed by the Kumision i Fino' CHamoru.

CREATE TABLE IF NOT EXISTS public.antonym_pairs (
  id          SERIAL PRIMARY KEY,
  word_a_id   INTEGER NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  word_b_id   INTEGER NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT no_self_pair
    CHECK (word_a_id <> word_b_id)
);

-- Prevents the same pair from being inserted in either direction (A,B) or (B,A).
CREATE UNIQUE INDEX IF NOT EXISTS one_pair_per_duo
  ON public.antonym_pairs (LEAST(word_a_id, word_b_id), GREATEST(word_a_id, word_b_id));
