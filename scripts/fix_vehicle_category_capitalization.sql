-- One-time fix: a single stray row was inserted with an uncapitalized
-- category value, missed by the earlier admin.js .toLowerCase() bug backfill
-- (backfill_category_capitalization.sql). "Vehicles" doesn't exist elsewhere
-- yet — this is the first row in it — so this also establishes its
-- capitalization to match every other category (plural noun, capitalized).
-- Safe to run once in the Supabase SQL editor.

UPDATE vocabulary SET category = 'Vehicles'
WHERE id = 321 AND category = 'vehicle';
