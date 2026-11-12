-- Migration: learner_verified_rls
-- Apply in: Supabase Dashboard → SQL Editor → Run
--
-- Database-level backstop for the learner-side verified filter: the anon role
-- (the public app) can only read verified vocabulary and verified antonym pairs
-- whose two words are both verified. The admin portal and coverage functions
-- use the service role key, which bypasses RLS, so they still see every row.
--
-- BEFORE RUNNING, list the existing policies:
--
--   SELECT tablename, policyname, roles, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('vocabulary', 'antonym_pairs');
--
-- Policies of the same command are OR'd together. If any existing SELECT
-- policy for anon (or public) has a looser condition such as `true`, it would
-- still expose unverified rows. Drop it before or after running this.

-- vocabulary -----------------------------------------------------------------

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners read verified vocabulary" ON public.vocabulary;

CREATE POLICY "Learners read verified vocabulary"
  ON public.vocabulary
  FOR SELECT
  TO anon
  USING (verified = true);

GRANT SELECT ON TABLE public.vocabulary TO anon;

-- antonym_pairs --------------------------------------------------------------

ALTER TABLE public.antonym_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners read verified antonym pairs" ON public.antonym_pairs;

CREATE POLICY "Learners read verified antonym pairs"
  ON public.antonym_pairs
  FOR SELECT
  TO anon
  USING (
    verified = true
    AND EXISTS (SELECT 1 FROM public.vocabulary v WHERE v.id = word_a_id AND v.verified = true)
    AND EXISTS (SELECT 1 FROM public.vocabulary v WHERE v.id = word_b_id AND v.verified = true)
  );

GRANT SELECT ON TABLE public.antonym_pairs TO anon;

-- No INSERT / UPDATE / DELETE policies are defined for anon on either table,
-- so RLS denies those by default.
