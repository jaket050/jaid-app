-- Kumision i Fino' CHamoru 2026 vocabulary import (commit d, part 1 of 2).
-- Apply in: Supabase Dashboard → SQL Editor → Run
--
-- Source: jaid_kumision_vocab_import.csv, matched against a 2026-11-12 export
-- of vocabulary (613 rows). Held rows are listed in vocab_import_held.md.
--
-- PREREQUISITE: supabase/migrations/20261112_vocabulary_alternate_chamoru.sql
-- (People rows and section 4 write alternate_chamoru).
--
-- Every row written here is verified = false. Nothing in this file changes
-- verified on an existing row. Re-running is safe: the category rename and
-- moves are guarded by their current values, each insert skips a row whose
-- chamorro already exists in the same category (case-insensitive), and the
-- alternate usages are only set while alternate_chamoru is still empty.
--
-- Difficulty for new rows: 2 for Legal, Government, Self Determination, Years
-- and Centuries and Numbers Ansiånu (specialized civic vocabulary and heritage
-- usage); 1 for every other category. Existing rows keep their difficulty.
--
-- Expected: rename 10 rows, move 6 rows, insert 211 rows (613 -> 824), set
-- alternate_chamoru on 2 existing rows.
-- The spelling updates are in vocab_orthography_updates.sql (part 2).

BEGIN;

-- 1. Rename Numbers -> Numbers Prisente (all 10 rows are the Spanish-based set).
UPDATE vocabulary SET category = 'Numbers Prisente' WHERE category = 'Numbers';

-- 2. Category moves with no spelling change (source left as is).
--    Biba rows go to Holidays and Religion; 242 and 251 are also respelled in part 2.
UPDATE vocabulary SET category = 'Holidays and Religion' WHERE id = 242 AND category = 'Greetings';  -- Biba komple'åños (Happy birthday)
UPDATE vocabulary SET category = 'Holidays and Religion' WHERE id = 243 AND category = 'Greetings';  -- Biba ha'ånen mafañagu-mu (Happy birthday)
UPDATE vocabulary SET category = 'Holidays and Religion' WHERE id = 248 AND category = 'Greetings';  -- Biba Ha'ånen Tåta (Happy Father's Day)
UPDATE vocabulary SET category = 'Holidays and Religion' WHERE id = 251 AND category = 'Greetings';  -- Biba komple'åños umákkamo' (Happy wedding anniversary)
UPDATE vocabulary SET category = 'Technology' WHERE id = 336 AND category = 'School';  -- kompiuta (Computer)
UPDATE vocabulary SET category = 'Land' WHERE id = 42 AND category = 'Nature';  -- tåno' (Land)

-- 3. New rows (211). Lines are CSV file lines; [held] rows are in vocab_import_held.md.

-- Numbers Prisente (12)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Numbers Prisente', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('onse', 'Eleven (11)', 'Word'),  -- line 81
  ('dosse', 'Twelve (12)', 'Word'),  -- line 82
  ('tresse', 'Thirteen (13)', 'Word'),  -- line 83
  ('katotse', 'Fourteen (14)', 'Word'),  -- line 84
  ('kinse', 'Fifteen (15)', 'Word'),  -- line 85
  ('disisais', 'Sixteen (16)', 'Word'),  -- line 86 [held]
  ('disisientte', 'Seventeen (17)', 'Word'),  -- line 87
  ('disiocho', 'Eighteen (18)', 'Word'),  -- line 88 [held]
  ('disinuebi', 'Nineteen (19)', 'Word'),  -- line 89
  ('bente', 'Twenty (20)', 'Word'),  -- line 90
  ('bente unu', 'Twenty One (21)', 'Phrase'),  -- line 91
  ('trentai ocho', 'Thirty Eight (38)', 'Phrase')  -- line 92
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Numbers Prisente' AND lower(x.chamorro) = lower(v.chamorro));

-- Numbers Ansiånu (22)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 2, 'Numbers Ansiånu', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('håcha', 'One (1)', 'Word'),  -- line 71
  ('hugua', 'Two (2)', 'Word'),  -- line 72
  ('tulu', 'Three (3)', 'Word'),  -- line 73
  ('fatfat', 'Four (4)', 'Word'),  -- line 74
  ('lima', 'Five (5)', 'Word'),  -- line 75
  ('gunom', 'Six (6)', 'Word'),  -- line 76
  ('fiti', 'Seven (7)', 'Word'),  -- line 77
  ('guålo', 'Eight (8)', 'Word'),  -- line 78
  ('sigua', 'Nine (9)', 'Word'),  -- line 79
  ('månot', 'Ten (10)', 'Word'),  -- line 80
  ('månot na gai håcha', 'Eleven (11)', 'Phrase'),  -- line 81
  ('månot na gai hugua', 'Twelve (12)', 'Phrase'),  -- line 82
  ('månot na gai tulu', 'Thirteen (13)', 'Phrase'),  -- line 83
  ('månot na gai fatfat', 'Fourteen (14)', 'Phrase'),  -- line 84
  ('månot na gai lima', 'Fifteen (15)', 'Phrase'),  -- line 85
  ('månot na gai gunom', 'Sixteen (16)', 'Phrase'),  -- line 86
  ('månot na gai fiti', 'Seventeen (17)', 'Phrase'),  -- line 87
  ('månot na gai guålo', 'Eighteen (18)', 'Phrase'),  -- line 88
  ('månot na gai sigua', 'Nineteen (19)', 'Phrase'),  -- line 89
  ('hugua na fulu', 'Twenty (20)', 'Phrase'),  -- line 90
  ('hugua na fulu na gai håcha', 'Twenty One (21)', 'Phrase'),  -- line 91
  ('tulu na fulu na gai guålo', 'Thirty Eight (38)', 'Phrase')  -- line 92
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Numbers Ansiånu' AND lower(x.chamorro) = lower(v.chamorro));

-- Weather (19)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Weather', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('guaifon metgot', 'wind gale', 'Phrase'),  -- line 5
  ('mattiempo', 'tropical depression', 'Word'),  -- line 7
  ('kumékepåkyo', 'stormy conditions', 'Word'),  -- line 8 [held]
  ('måsmai', 'saturated', 'Word'),  -- line 11
  ('tehte/såtpon', 'drizzle/sprinkle', 'Phrase'),  -- line 12
  ('tiempon uchan/fanuchånan', 'rainy/wet season', 'Phrase'),  -- line 18 [held]
  ('tiempon somnak/fañomnåkan', 'sunny/dry season', 'Phrase'),  -- line 19 [held]
  ('någan gotpe', 'flash flood', 'Phrase'),  -- line 23
  ('milak fache''', 'mudslide', 'Phrase'),  -- line 24 [held]
  ('rimulinon hånom', 'water spout', 'Phrase'),  -- line 28
  ('essok mapagåhes', 'cumulus clouds', 'Phrase'),  -- line 35
  ('nåpon tåsi', 'ocean swell', 'Phrase'),  -- line 36 [held]
  ('malinao', 'calm ocean', 'Word'),  -- line 39
  ('hafñot/missen i tasi', 'high tide', 'Phrase'),  -- line 40 [held]
  ('gualåfon', 'full moon', 'Word'),  -- line 42
  ('sinahi', 'crescent moon', 'Word'),  -- line 43
  ('hinemhom pulan', 'new moon', 'Phrase'),  -- line 44
  ('kiniles åtdao', 'solar eclipse', 'Phrase'),  -- line 45
  ('kiniles pulan', 'lunar eclipse', 'Phrase')  -- line 46
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Weather' AND lower(x.chamorro) = lower(v.chamorro));

-- Holidays and Religion (10)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Holidays and Religion', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Biba Ha''ånen Hotnaleru', 'Happy Labor Day', 'Phrase'),  -- line 108
  ('Biba Gupot Mañåntos', 'Happy All Saints Day', 'Phrase'),  -- line 110
  ('Biba Ha''ånen Graduhasión', 'Happy Graduation Day', 'Phrase'),  -- line 111
  ('Biba Ha''ånen Kinahulo'' Jesukristo', 'Happy Easter', 'Phrase'),  -- line 112
  ('Biba Ha''ånen Mimuriåt', 'Happy Memorial Day', 'Phrase'),  -- line 113 [held]
  ('Biba Ha''ånen Endependente', 'Happy 4th of July/Happy Independence Day', 'Phrase'),  -- line 114 [held]
  ('Biba Ha''ånen Linibette', 'Happy Liberation Day', 'Phrase'),  -- line 115 [held]
  ('Biba Ha''ånen Taotao Tåno'' Siha', 'Happy Indigenous Peoples'' Day', 'Phrase'),  -- line 116
  ('Biba Ha''ånen Fåfa''ñahgue', 'Happy Halloween', 'Phrase'),  -- line 117 [held]
  ('Biba Ha''ånen Anten Manmåtai', 'Happy All Souls'' Day', 'Phrase')  -- line 118 [held]
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Holidays and Religion' AND lower(x.chamorro) = lower(v.chamorro));

-- Time (2)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Time', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('ma''posña na simåna', 'week before last', 'Phrase'),  -- line 122
  ('mamailá''ña na simåna', 'two weeks from now', 'Phrase')  -- line 124
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Time' AND lower(x.chamorro) = lower(v.chamorro));

-- People (26)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified, alternate_chamoru)
SELECT v.chamorro, v.english, v.type, 1, 'People', 'Kumision i Fino'' CHamoru 2026', false, v.alternate_chamoru
FROM (VALUES
  ('Siñora/Siñot', 'Ms./Mrs./Mr.', 'Phrase', NULL::text),  -- line 153
  ('Maga''håga/Maga''låhi', 'Governor', 'Phrase', 'Gubietno/Gubetno'::text),  -- line 154
  ('Sigundo Maga''håga/Maga''låhi', 'Lieutenant Governor', 'Phrase', 'Tiñente Gubietno/Gubetno'::text),  -- line 155
  ('Gé''helo''', 'Chairperson', 'Word', 'Må''gas'::text),  -- line 156
  ('Bisa Gé''helo''', 'Vice Chairperson', 'Phrase', 'Sigundo Må''gas'::text),  -- line 157
  ('Mahót', 'Mayor', 'Word', 'Atkådi/Kumísiona'::text),  -- line 158
  ('Bisa Mahót', 'Vice Mayor', 'Phrase', 'Sigundo Mahót'::text),  -- line 159
  ('Prensepåt', 'Principal', 'Word', 'Prínsepo'''::text),  -- line 160 [held]
  ('Bisa Prensepåt', 'Vice Principal', 'Phrase', 'Sigundo Prínsepo'''::text),  -- line 161 [held]
  ('Eksekutibu', 'Executive Director/Administrator', 'Word', 'Atmenestradora/Atmenestradót'::text),  -- line 162
  ('Káma''gas', 'Director', 'Word', 'Direktora/Direktót'::text),  -- line 163
  ('Káka''ma''gas', 'Deputy Director', 'Word', 'Bisa Direktora/Direktót'::text),  -- line 164
  ('Ayudånten Ufisina', 'Secretary', 'Phrase', 'Sikritåria/Sikritåriu'::text),  -- line 165
  ('Membron Lehislatura', 'Senator', 'Phrase', 'Sinadora/Sinadót'::text),  -- line 166 [held]
  ('Sísigon Bås', 'Bus Driver', 'Phrase', 'Draiban Bås'::text),  -- line 167
  ('Manna''homlo''', 'Nurse', 'Word', 'Emfetmera/Emfetmeru'::text),  -- line 168
  ('Pattera', 'Midwife', 'Word', 'Emfetmeran Muna''fañågu'::text),  -- line 169
  ('Fåfa''na''gue', 'Teacher', 'Word', 'Ma''estra/Ma''estro'::text),  -- line 170
  ('Atbesót', 'School Counselor', 'Word', 'Konseheran Eskuela'::text),  -- line 171
  ('Taotao Fanlepbluyan', 'Librarian', 'Phrase', 'Laibirihadora/dót'::text),  -- line 172 [held]
  ('Påle''', 'Priest', 'Word', 'Pådre'::text),  -- line 175
  ('Etmåna', 'Nun', 'Word', 'Mådri'::text),  -- line 176
  ('Må''gas Kusina', 'Head Chef/Head Cook', 'Phrase', 'Kapuråt'::text),  -- line 177 [held]
  ('Taotao Kusina', 'Cafeteria Worker', 'Phrase', 'Kusinera/u'::text),  -- line 178 [held]
  ('Taotao Numá''gasgas', 'Janitor', 'Phrase', 'Nána''gasgas'::text),  -- line 179 [held]
  ('Såstre', 'Seamstress', 'Word', 'Lálakse'::text)  -- line 180
) AS v(chamorro, english, type, alternate_chamoru)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'People' AND lower(x.chamorro) = lower(v.chamorro));

-- Land (9)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Land', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('yiugráfiku', 'geographic', 'Word'),  -- line 181
  ('isla', 'island', 'Word'),  -- line 183
  ('siudåt', 'city', 'Word'),  -- line 184 [held]
  ('destritu', 'district', 'Word'),  -- line 185
  ('estådu', 'state', 'Word'),  -- line 186
  ('songsong', 'village', 'Word'),  -- line 187
  ('påtten songsong', 'locale', 'Phrase'),  -- line 188
  ('sabaneta', 'meadow/grassy flat land/plain', 'Word'),  -- line 193
  ('måtan hånom', 'water lens', 'Phrase')  -- line 197
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Land' AND lower(x.chamorro) = lower(v.chamorro));

-- Places (2)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Places', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Agaña Heights-Tutuhan', 'Agaña Heights-Tutuhan', 'Phrase'),  -- line 246
  ('Mongmong-To''to-Maite''', 'Monmong-Toto-Maite', 'Word')  -- line 253
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Places' AND lower(x.chamorro) = lower(v.chamorro));

-- Technology (10)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Technology', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Teknoloyiha', 'Technology', 'Word'),  -- line 60
  ('Imel', 'E-mail', 'Word'),  -- line 62
  ('Inachetton', 'Attachment', 'Word'),  -- line 63
  ('Yum', 'Zoom', 'Word'),  -- line 64
  ('Huebsait', 'Website', 'Word'),  -- line 65
  ('Estatistek', 'Statistics', 'Word'),  -- line 66
  ('Tekngo'' Prugråman Kompiuta', 'Software Developer or Programmer', 'Phrase'),  -- line 67
  ('Kualidåt', 'Quality', 'Word'),  -- line 68 [held]
  ('Púpbleko', 'Public', 'Word'),  -- line 69
  ('Tilifón Sel', 'Cellphone', 'Phrase')  -- line 70
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Technology' AND lower(x.chamorro) = lower(v.chamorro));

-- Years and Centuries (13)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 2, 'Years and Centuries', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Siklon Disisaís', '1500-1599 (1600''s)', 'Phrase'),  -- line 139 [held]
  ('Siklon Disisiette', '1600-1699 (1700''s)', 'Phrase'),  -- line 140
  ('Siklon Disi''ocho', '1700-1799 (1800''s)', 'Phrase'),  -- line 141 [held]
  ('Siklon Disinuebi', '1800-1899 (1900''s)', 'Phrase'),  -- line 142
  ('Siklon Bente', '1900-1999 (2000''s)', 'Phrase'),  -- line 143
  ('Siklon Bente Unu', '2000-2099 (2100''s)', 'Phrase'),  -- line 144
  ('Mit Disinuebi Sisenta', '1960', 'Phrase'),  -- line 145
  ('Mit Disinuebi Sitentai Tres', '1973', 'Phrase'),  -- line 146
  ('Mit Disinuebi Uchentai Nuebi', '1989', 'Phrase'),  -- line 147
  ('Mit Disinuebi Nubenta', '1990', 'Phrase'),  -- line 148
  ('Dos Mit', '2000', 'Phrase'),  -- line 149
  ('Dos Mit Bente', '2020', 'Phrase'),  -- line 150
  ('Dos Mit Bente Sais', '2026', 'Phrase')  -- line 151
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Years and Centuries' AND lower(x.chamorro) = lower(v.chamorro));

-- Legal (19)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 2, 'Legal', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Kotte', 'Court', 'Word'),  -- line 211
  ('Lai', 'Law', 'Word'),  -- line 212
  ('Hues', 'Judge', 'Word'),  -- line 213
  ('Hostisia', 'Justice', 'Word'),  -- line 214
  ('Kaosa', 'Lawsuit', 'Word'),  -- line 215
  ('Kaosadót', 'Plaintiff', 'Word'),  -- line 216
  ('Abugáo Difensót', 'Defense Attorney', 'Phrase'),  -- line 217
  ('Abugáo/Abugådu', 'Lawyer', 'Phrase'),  -- line 218
  ('Kontråta', 'Contract', 'Word'),  -- line 219
  ('Niñegan i Kontråta', 'To break a contract', 'Phrase'),  -- line 220
  ('Upiñón', 'Opinion', 'Word'),  -- line 221
  ('Títestegu', 'Witness', 'Word'),  -- line 222
  ('Akusa', 'To Prosecute', 'Word'),  -- line 223
  ('Manakúkusa', 'Prosecutor', 'Word'),  -- line 224
  ('Inagang Kotte', 'Subpoena', 'Phrase'),  -- line 225
  ('Huisio', 'Verdict', 'Word'),  -- line 226
  ('Linibettå, masotta', 'Acquittal', 'Phrase'),  -- line 227 [held]
  ('Kontråriu', 'Defendant', 'Word'),  -- line 228
  ('Abugáo Púpbleko', 'Public Defender', 'Phrase')  -- line 229
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Legal' AND lower(x.chamorro) = lower(v.chamorro));

-- Government (15)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 2, 'Government', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Råmas Eksekutibu', 'Executive Branch', 'Phrase'),  -- line 230 [section header]
  ('Ufisinan i Maga''håga/Maga''låhi', 'Governor''s Office', 'Phrase'),  -- line 231
  ('Dipåttamento yan Ahensia Siha', 'Departments and Agencies', 'Phrase'),  -- line 232
  ('Konsehilon Mahót Guåhan Siha', 'Mayors Council of Guam', 'Phrase'),  -- line 233
  ('Råmas Liheslatura', 'Legislative Branch', 'Phrase'),  -- line 234 [held] [section header]
  ('Liheslaturan Guåhan', 'Guam Legislature', 'Phrase'),  -- line 235 [held]
  ('Kuíkuentos', 'Speaker', 'Word'),  -- line 236
  ('Bisa Kuíkuentos', 'Vice Speaker', 'Phrase'),  -- line 237
  ('Sikritårian Liheslatura', 'Legislative Secretary', 'Phrase'),  -- line 238 [held]
  ('Sinadót/Sinadora', 'Senator', 'Phrase'),  -- line 239
  ('Råmas Hudisiåt', 'Judiciary Branch', 'Phrase'),  -- line 240 [held] [section header]
  ('Kotten Supiriåt Guåhan', 'Superior Court of Guam', 'Phrase'),  -- line 241
  ('Etmås Gé''helo'' na Hues', 'Presiding Judge', 'Phrase'),  -- line 242
  ('Hues', 'Judge', 'Word'),  -- line 243
  ('Kotten Destriton Estådos Unidos Guåhan', 'U.S. District Court of Guam', 'Phrase')  -- line 244
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Government' AND lower(x.chamorro) = lower(v.chamorro));

-- Self Determination (35)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 2, 'Self Determination', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Asusiasión Linibre', 'Free Association', 'Phrase'),  -- line 265
  ('Deklarasión', 'Declaration', 'Word'),  -- line 266
  ('Diknedåt', 'Dignity', 'Word'),  -- line 267 [held]
  ('Dimukrasiha', 'Democracy', 'Word'),  -- line 268
  ('Dinitetminasión Maisa', 'Self-Determination', 'Phrase'),  -- line 269
  ('Direcho', 'Rights', 'Word'),  -- line 270
  ('Direchon I Taotao Tåno''', 'The Rights of a People', 'Phrase'),  -- line 271
  ('Endependensia', 'Independence', 'Word'),  -- line 272
  ('Endíhinu', 'Indigenous', 'Word'),  -- line 273
  ('Estådon Amérika', 'Statehood', 'Phrase'),  -- line 274
  ('Estáo Kuluniha', 'Status Quo/Status of Colony', 'Phrase'),  -- line 275 [held]
  ('Estao Pulitikåt', 'Political Status', 'Phrase'),  -- line 276 [held]
  ('Fa''sangi', 'To be Excluded', 'Word'),  -- line 277
  ('Fama''taotao', 'Treat with Dignity', 'Word'),  -- line 278 [held]
  ('Finaloffan i Taotao Tåno''', 'Indigenous History', 'Phrase'),  -- line 279
  ('Fininas Hinasso, Tinigo'' yan Lina''la''', 'Colonial Indoctrination/Assimilation', 'Phrase'),  -- line 280
  ('Fininas Taotao, Fino'' yan Tåno''', 'Genocide', 'Phrase'),  -- line 281
  ('Ginepten i Tinaotao-ta', 'Cultural Sovereignty', 'Phrase'),  -- line 282
  ('Guailaye', 'Agency/Power', 'Word'),  -- line 283
  ('Guinaha', 'Resources', 'Word'),  -- line 284
  ('Hinatme', 'Occupation', 'Word'),  -- line 285
  ('Hinemlo''', 'Healing', 'Word'),  -- line 286
  ('Hineño''', 'Oppression', 'Word'),  -- line 287
  ('Hinilat', 'Overcome', 'Word'),  -- line 288
  ('Hinipa', 'Displacement', 'Word'),  -- line 289
  ('Hostisia', 'Justice', 'Word'),  -- line 290
  ('Kinahulo'' Tinaotao', 'Nation Building', 'Phrase'),  -- line 291
  ('Mumuyi', 'Fight for/Champion a cause', 'Word'),  -- line 292
  ('Repestu', 'Respect', 'Word'),  -- line 293 [held]
  ('Sin Makuluniha', 'Decolonization', 'Phrase'),  -- line 294
  ('Tai Respetu', 'Disrespectful', 'Phrase'),  -- line 295
  ('Tailaye', 'Injustice', 'Word'),  -- line 296
  ('Tinaotao-ta', 'Peoplehood', 'Word'),  -- line 297
  ('Tinilaika', 'Change', 'Word'),  -- line 298
  ('Umitde', 'Humble', 'Word')  -- line 299
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Self Determination' AND lower(x.chamorro) = lower(v.chamorro));

-- Islands (17)
INSERT INTO vocabulary (chamorro, english, type, difficulty, category, source, verified)
SELECT v.chamorro, v.english, v.type, 1, 'Islands', 'Kumision i Fino'' CHamoru 2026', false
FROM (VALUES
  ('Tåno'' Låguas', 'Southern Islands in the Marianas Archipelago', 'Phrase'),  -- line 300 [section header]
  ('Guåhan', 'Guam', 'Word'),  -- line 301
  ('Luta', 'Rota', 'Word'),  -- line 302
  ('Aguiguan', 'Aguiguan', 'Word'),  -- line 303
  ('Tini''an', 'Tinian', 'Word'),  -- line 304
  ('Sa''ipan', 'Saipan', 'Word'),  -- line 305
  ('Tåno'' Gåni', 'Northern Islands in the Marianas Archipelago', 'Phrase'),  -- line 306 [section header]
  ('No''os', 'Farallon de Medinilla', 'Word'),  -- line 307
  ('Anatåhan', 'Anatahan', 'Word'),  -- line 308
  ('Saligan', 'Sariguan', 'Word'),  -- line 309
  ('Gugu''an', 'Guguan', 'Word'),  -- line 310
  ('Alamågan', 'Alamagan', 'Word'),  -- line 311
  ('Pågan', 'Pagan', 'Word'),  -- line 312
  ('Akligan', 'Agrihan', 'Word'),  -- line 313
  ('As Songsong', 'Asuncion', 'Phrase'),  -- line 314
  ('Må''ok', 'Maug (Maug Islands)', 'Word'),  -- line 315
  ('Ulåkas', 'Farallon de Pajaros', 'Word')  -- line 316
) AS v(chamorro, english, type)
WHERE NOT EXISTS (SELECT 1 FROM vocabulary x WHERE x.category = 'Islands' AND lower(x.chamorro) = lower(v.chamorro));

-- 4. Alternate usages printed in Position Titles for two existing rows whose
--    CSV copies were skipped (each stays in its current category). Stored
--    verbatim; source and cultural_note are left unchanged.
UPDATE vocabulary SET alternate_chamoru = 'Tan/Tun/Nan'
WHERE id = 58 AND chamorro = 'saina' AND alternate_chamoru IS NULL;  -- Family, Elder (line 152)
UPDATE vocabulary SET alternate_chamoru = 'Suruhåna/Suruhånu'
WHERE id = 234 AND alternate_chamoru IS NULL;  -- Culture, Traditional healer (line 173)

COMMIT;
