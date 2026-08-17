-- 1. Rename "Body Parts" -> "Anatomy" for the 22 anatomy words
--    (excludes ids 550, 551 which move to "People" below).
UPDATE vocabulary
SET category = 'Anatomy'
WHERE id IN (
  528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539,
  540, 541, 542, 543, 544, 545, 546, 547, 548, 549
);

-- 2. Move ids 550 (neni, Baby) and 551 (palao'an, Girl) into "People",
--    joining the existing People rows (68, 72, 73).
UPDATE vocabulary
SET category = 'People'
WHERE id IN (550, 551);
