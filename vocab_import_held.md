# Kumision import: held list

Generated 2026-11-12 from `jaid_kumision_vocab_import.csv` and `vocabulary_export.csv`. Line numbers are CSV file lines (header is line 1); ids are `vocabulary.id`. Held means the row is written with `verified = false` and stays unverified until the question is resolved.

## 1. New rows inserted unverified and held (34)

| Line | Category | CHamoru | English | Why held |
|---|---|---|---|---|
| 8 | Weather | kumékepåkyo | stormy conditions | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. |
| 18 | Weather | tiempon uchan/fanuchånan | rainy/wet season | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. |
| 19 | Weather | tiempon somnak/fañomnåkan | sunny/dry season | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. |
| 24 | Weather | milak fache' | mudslide | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. Different word, not a respelling of the PDF's *måtmon fache'*, which is **not** in the database. |
| 36 | Weather | nåpon tåsi | ocean swell | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. |
| 40 | Weather | hafñot/missen i tasi | high tide | Not just a respelling. Hold for Kumision confirmation. Do not update the existing row. Also: *tasi* here vs *tåsi* (lines 36, 189). |
| 68 | Technology | Kualidåt | Quality | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 86 | Numbers Prisente | disisais | Sixteen | *disisais* here vs *Siklon Disisaís* (line 139). |
| 88 | Numbers Prisente | disiocho | Eighteen | *disiocho* here vs *Siklon Disi'ocho* (line 141). |
| 113 | Holidays and Religion | Biba Ha'ånen Mimuriåt | Happy Memorial Day | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 114 | Holidays and Religion | Biba Ha'ånen Endependente | Happy 4th of July/Happy Independence Day | *Endependente* vs *Endependensian* (line 52). |
| 115 | Holidays and Religion | Biba Ha'ånen Linibette | Happy Liberation Day | *Linibette* vs *Libirasión* (line 53). |
| 117 | Holidays and Religion | Biba Ha'ånen Fåfa'ñahgue | Happy Halloween | In the screenshot this row has the English in the CHamoru column and the CHamoru in the English column. Entered here with the sides corrected. Confirm against the source. Also: Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 118 | Holidays and Religion | Biba Ha'ånen Anten Manmåtai | Happy All Souls' Day | In the screenshot this row has the English in the CHamoru column and the CHamoru in the English column. Entered here with the sides corrected. Confirm against the source. *Anten Manmåtai* vs *Ånimas* (line 55) for All Souls' Day. |
| 139 | Years and Centuries | Siklon Disisaís | 1500-1599 (1600's) | *Disisaís* vs *Disisais* in Numbers (line 86). |
| 141 | Years and Centuries | Siklon Disi'ocho | 1700-1799 (1800's) | *Disi'ocho* vs *Disiocho* in Numbers (line 88). |
| 160 | People | Prensepåt (alternate: Prínsepo') | Principal | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 161 | People | Bisa Prensepåt (alternate: Sigundo Prínsepo') | Vice Principal | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 166 | People | Membron Lehislatura (alternate: Sinadora/Sinadót) | Senator | Spelled *Lehislatura* here but *Liheslatura* in lines 234, 235, 238; unclear which is the source typo. |
| 172 | People | Taotao Fanlepbluyan (alternate: Laibirihadora/dót) | Librarian | Alternate *Laibirihadora/dót* is suffix shorthand. Stored verbatim, not expanded. |
| 177 | People | Må'gas Kusina (alternate: Kapuråt) | Head Chef/Head Cook | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. Applies to the alternate form Kapuråt. |
| 178 | People | Taotao Kusina (alternate: Kusinera/u) | Cafeteria Worker | Alternate *Kusinera/u* is suffix shorthand. Stored verbatim, not expanded. |
| 179 | People | Taotao Numá'gasgas (alternate: Nána'gasgas) | Janitor | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. Applies to the alternate form Nána'gasgas. |
| 184 | Land | siudåt | city | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 227 | Legal | Linibettå, masotta | Acquittal | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 234 | Government | Råmas Liheslatura | Legislative Branch | *Liheslatura* vs *Lehislatura* in line 166. |
| 235 | Government | Liheslaturan Guåhan | Guam Legislature | *Liheslatura* vs *Lehislatura* in line 166. |
| 238 | Government | Sikritårian Liheslatura | Legislative Secretary | *Liheslatura* vs *Lehislatura* in line 166. |
| 240 | Government | Råmas Hudisiåt | Judiciary Branch | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 267 | Self Determination | Diknedåt | Dignity | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 275 | Self Determination | Estáo Kuluniha | Status Quo/Status of Colony | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 276 | Self Determination | Estao Pulitikåt | Political Status | Accent or final letter glyph is unclear in the screenshot. Confirm against the source document. |
| 278 | Self Determination | Fama'taotao | Treat with Dignity | Screenshot reads *Fama'taotao*; your rule is *Fa'taotao*. You will check the source page. |
| 293 | Self Determination | Repestu | Respect | Screenshot reads Repestu, but the row for Tai Respetu spells it Respetu. Likely a source typo. Confirm the spelling. |

## 2. Existing rows respelled but held (6)

The spelling is updated to the CSV form; `verified` is left unchanged (all currently false).

| Line | id | Category | Existing | Becomes | Why held |
|---|---|---|---|---|---|
| 32 | 120 | Weather | kánopblådu | kánopbladu | Drops the å of *blådu*, but line 34 keeps *nopblådu*. |
| 33 | 121 | Weather | lánopblådu | lánopbladu | Drops the å of *blådu*, but line 34 keeps *nopblådu*. |
| 52 | 255 | Holidays and Religion | Ha'ånen Independiensean Amérika | Ha'ånen Endependensian Amérika | *Endependensian* vs *Endependente* (line 114). |
| 53 | 256 | Holidays and Religion | Ha'ånen Liberasión Guåhan | Ha'ånen Libirasión Guåhan | *Libirasión* vs *Linibette* (line 115). |
| 98 | 241 | Greetings | Ástaki umáli'e' hit ta'lo | Åstaki Umali'e' Hit Ta'lo | *Åstaki* vs *astakí* (line 128). |
| 128 | 276 | Time | ástaki | astakí | *astakí* vs *Åstaki* (line 98). |

## 3. No change made, held

| What | Detail |
|---|---|
| id 287 *pinalaspas hånom* (Water) and line 196 *palaspas hånom* (Geographic Features) | The pin- prefix may mark a derived form, so they may be two different words. Neither is updated or imported. |
| id 235 *Buenas dias* (Greetings) | Older form. Not modified or deleted. Id 11 is updated to the Kumision's *Manana Si Yu'os/Buenas Dihas* (line 94); 235 stays beside it, unverified, until the Kumision rules on retiring it. |
| id 124 *maipe* (Weather), line 13 | CSV gloss *warm/hot* vs existing *Hot*. Not just a respelling; existing row not updated. |
| id 254 *Ha'ånen Mimuriåt* (Holidays and Religion), line 51 | Matches the CSV exactly, but the CSV glyph is unclear. Don't verify until confirmed. |
| id 258 *Ha'ånen Ånimas* (Holidays and Religion), line 55 | Matches the CSV, but the source also uses *Anten Manmåtai* (line 118) for All Souls' Day. |

## 4. Import rulings (2026-11-12)

- **Store verbatim.** Slash variants stay one row as printed; suffix shorthand (*Kusinera/u*) is never expanded.
- **Update vs new row.** A slash form that keeps the existing word, possibly respelled, updates that row in place (e.g. line 94 updates id 11, line 99 updates id 242; id 243 is left as is). A new row is right only when the CSV form replaces the existing word with something unrelated (e.g. *milak fache'*).
- **Different words are never respellings.** They go in beside the existing row, held.
- **Category moves.** All Biba rows go to Holidays and Religion (ids 242, 243, 248, 251). *kompiuta* (336) goes to Technology and *tåno'* (42) to Land. *tåsi*, *såddok*, *hagoi*, *bo'bo'* stay in Water; *saina* stays in Family; *techa* stays in Holidays and Religion; their CSV copies are skipped.
- **Orthography updates outside the target category.** *mattingan* → *ma'tingan* (295, Water) and *yo'åmte* → *yó'amte* (234, Culture), category unchanged.
- **Numbers.** Ansiånu and Prisente are separate systems: categories *Numbers Ansiånu* and *Numbers Prisente* (renamed from *Numbers*). House style: lowercase CHamoru, glosses like *One (1)*. Only Prisente is in the ordered learning path.
- **Section headers** are imported as ordinary Phrase rows in Government and Islands.
- **Casing.** Other CSV casing is kept as printed; house style is not retrofitted onto unrelated rows.
- **Type and source.** *Word* for single words, *Phrase* for multi-word, comma and slash entries. New rows and respelled rows carry the source *Kumision i Fino' CHamoru 2026*; rows that only move keep their source.
- **verified.** Every new row is false; no existing row's verified value is changed.

## 5. Kumision touchpoint list

1. *milak fache'* (line 24): a new term for mudslide, or a replacement for *måtmon fache'*?
2. *palaspas hånom* vs *pinalaspas hånom*: two words or one?
3. *Buenas dias* (id 235): retire in favor of *Buenas Dihas*?
4. *kumékepåkyo* (line 8): stormy conditions, or tropical storm as in the 2025 PDF?
5. *maipe* (line 13): warm/hot, or hot only?
6. *tiempon uchan/fanuchånan* and *tiempon somnak/fañomnåkan* (lines 18, 19): combined entries, while the 2025 PDF lists them separately (*tiempon uchan* = monsoon).
7. *nåpon tåsi* (line 36): ocean swell vs swell.
8. *hafñot/missen i tasi* (line 40): vs the 2025 PDF *håfno'/håfnot*, and *tasi* without å.
9. Suffix shorthand: *Laibirihadora/dót* (172), *Kusinera/u* (178). What are the full forms?
10. *Lehislatura* (166) vs *Liheslatura* (234, 235, 238).
11. *Disisais/Disiocho* (Numbers 86, 88) vs *Disisaís/Disi'ocho* (Years 139, 141).
12. *Åstaki* (98) vs *astakí* (128).
13. *blådu* vs *bladu* (32, 33 vs 34).
14. *Endependensian* (52) vs *Endependente* (114); *Libirasión* (53) vs *Linibette* (115); *Ånimas* (55) vs *Anten Manmåtai* (118).
15. Unclear glyphs: lines 51, 68, 113, 117, 160, 161, 177, 179, 184, 227, 240, 267, 275, 276.
16. Swapped columns in the source table: lines 117, 118.
17. *Repestu* (293): source typo for *Respetu*?

Yours to check (not the Kumision's): *Fama'taotao* (278) vs your rule *Fa'taotao*.
