-- One-time backfill: restore correct capitalized category values for the
-- 16 rows corrupted by the admin.js .toLowerCase() bug (fixed separately).
-- Safe to run once in the Supabase SQL editor.

UPDATE vocabulary SET category = CASE id
  WHEN 14  THEN 'Family'
  WHEN 59  THEN 'Family'
  WHEN 60  THEN 'Family'
  WHEN 66  THEN 'Family'
  WHEN 28  THEN 'Food'
  WHEN 187 THEN 'Holidays and Religion'
  WHEN 190 THEN 'Holidays and Religion'
  WHEN 197 THEN 'Holidays and Religion'
  WHEN 224 THEN 'Holidays and Religion'
  WHEN 225 THEN 'Holidays and Religion'
  WHEN 247 THEN 'Holidays and Religion'
  WHEN 261 THEN 'Holidays and Religion'
  WHEN 42  THEN 'Nature'
  WHEN 133 THEN 'Places'
  WHEN 124 THEN 'Weather'
  WHEN 371 THEN 'Weather'
  ELSE category
END
WHERE id IN (14, 59, 60, 66, 28, 187, 190, 197, 224, 225, 247, 261, 42, 133, 124, 371);
