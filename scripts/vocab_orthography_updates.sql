-- Kumision i Fino' CHamoru 2026 orthography updates (commit d, part 2 of 2).
-- Apply in: Supabase Dashboard → SQL Editor → Run (after part 1 or before; order does not matter).
--
-- Each statement changes chamorro to the form printed in the updated Kumision
-- tables and sets source to the 2026 label. id, english, type, category and
-- verified are left unchanged. Each is guarded by the current spelling, so a
-- row that was edited since the 2026-11-12 export is skipped, and re-running is
-- a no-op.
--
-- Rule: a slash form that keeps the existing word (possibly respelled) is an
-- update, not a new row.
--
-- Expected: 21 rows updated. [held] rows are in vocab_import_held.md.

BEGIN;

-- id 11 (Greetings, Good morning), line 94: Manana si Yu'os -> Manana Si Yu'os/Buenas Dihas
UPDATE vocabulary SET chamorro = 'Manana Si Yu''os/Buenas Dihas', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 11 AND chamorro = 'Manana si Yu''os';

-- id 102 (Months of the Year, September), line 207: Septiembre -> Septiembre/Septembre
UPDATE vocabulary SET chamorro = 'Septiembre/Septembre', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 102 AND chamorro = 'Septiembre';

-- id 104 (Months of the Year, November), line 209: Nubiembre -> Nubiembre/Nubembre
UPDATE vocabulary SET chamorro = 'Nubiembre/Nubembre', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 104 AND chamorro = 'Nubiembre';

-- id 105 (Months of the Year, December), line 210: Disiembre -> Disiembre/Disembre
UPDATE vocabulary SET chamorro = 'Disiembre/Disembre', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 105 AND chamorro = 'Disiembre';

-- id 118 (Weather, Flood), line 22: någa -> någa/dilubiu
UPDATE vocabulary SET chamorro = 'någa/dilubiu', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 118 AND chamorro = 'någa';

-- id 120 (Weather, Partly cloudy), line 32 [held]: kánopblådu -> kánopbladu
UPDATE vocabulary SET chamorro = 'kánopbladu', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 120 AND chamorro = 'kánopblådu';

-- id 121 (Weather, Mostly cloudy), line 33 [held]: lánopblådu -> lánopbladu
UPDATE vocabulary SET chamorro = 'lánopbladu', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 121 AND chamorro = 'lánopblådu';

-- id 187 (Holidays and Religion, Merry Christmas), line 101: Filis Nabidåt -> Biba Mafañågon Niñu Jesus/Filís Nabidåt
UPDATE vocabulary SET chamorro = 'Biba Mafañågon Niñu Jesus/Filís Nabidåt', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 187 AND chamorro = 'Filis Nabidåt';

-- id 188 (Holidays and Religion, Christmas Day), line 59: Ha'ånen Mafañågun Jesukristo -> Ha'ånen Mafañågon Jesukristo
UPDATE vocabulary SET chamorro = 'Ha''ånen Mafañågon Jesukristo', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 188 AND chamorro = 'Ha''ånen Mafañågun Jesukristo';

-- id 234 (Culture, Traditional healer), line 173: yo'åmte -> yó'amte
UPDATE vocabulary SET chamorro = 'yó''amte', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 234 AND chamorro = 'yo''åmte';

-- id 241 (Greetings, Until we meet again), line 98 [held]: Ástaki umáli'e' hit ta'lo -> Åstaki Umali'e' Hit Ta'lo
UPDATE vocabulary SET chamorro = 'Åstaki Umali''e'' Hit Ta''lo', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 241 AND chamorro = 'Ástaki umáli''e'' hit ta''lo';

-- id 242 (Greetings, Happy birthday), line 99: Biba komple'åños -> Biba Komple'åños/Biba Ha'ånen Mafañågu-mu
UPDATE vocabulary SET chamorro = 'Biba Komple''åños/Biba Ha''ånen Mafañågu-mu', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 242 AND chamorro = 'Biba komple''åños';

-- id 251 (Greetings, Happy wedding anniversary), line 100: Biba komple'åños umákkamo' -> Biba Komple'åños Umåkkamo'/Kasamiento
UPDATE vocabulary SET chamorro = 'Biba Komple''åños Umåkkamo''/Kasamiento', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 251 AND chamorro = 'Biba komple''åños umákkamo''';

-- id 255 (Holidays and Religion, Independence Day), line 52 [held]: Ha'ånen Independiensean Amérika -> Ha'ånen Endependensian Amérika
UPDATE vocabulary SET chamorro = 'Ha''ånen Endependensian Amérika', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 255 AND chamorro = 'Ha''ånen Independiensean Amérika';

-- id 256 (Holidays and Religion, Liberation Day), line 53 [held]: Ha'ånen Liberasión Guåhan -> Ha'ånen Libirasión Guåhan
UPDATE vocabulary SET chamorro = 'Ha''ånen Libirasión Guåhan', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 256 AND chamorro = 'Ha''ånen Liberasión Guåhan';

-- id 264 (Time, Day), line 119: ha'åni -> ha'åni/diha
UPDATE vocabulary SET chamorro = 'ha''åni/diha', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 264 AND chamorro = 'ha''åni';

-- id 268 (Time, Tomorrow), line 133: ågupa' -> agupa'
UPDATE vocabulary SET chamorro = 'agupa''', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 268 AND chamorro = 'ågupa''';

-- id 271 (Time, Day after tomorrow), line 134: ågupa' ña -> agupá'ña/inakpå'ña
UPDATE vocabulary SET chamorro = 'agupá''ña/inakpå''ña', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 271 AND chamorro = 'ågupa'' ña';

-- id 274 (Time, After), line 138: despues -> despues/despuesdi
UPDATE vocabulary SET chamorro = 'despues/despuesdi', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 274 AND chamorro = 'despues';

-- id 276 (Time, Until), line 128 [held]: ástaki -> astakí
UPDATE vocabulary SET chamorro = 'astakí', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 276 AND chamorro = 'ástaki';

-- id 295 (Water, Reef), line 195: mattingan -> ma'tingan
UPDATE vocabulary SET chamorro = 'ma''tingan', source = 'Kumision i Fino'' CHamoru 2026'
WHERE id = 295 AND chamorro = 'mattingan';

COMMIT;
