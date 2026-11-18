// Drift check: do the map games' static word lists still match the verified
// vocabulary in Supabase? Read only: it never writes to Supabase or to any
// file. Run with:
//   npm run check:names        (or: node scripts/check-static-names.mjs)
//
// Credentials come from the app's own .env (VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY). They are never printed. With the anon key, Row
// Level Security returns verified rows only, so a row that is missing and a
// row that is not verified look the same here and are reported together.
//
// Spellings and glosses are compared exactly after Unicode NFC
// normalization: no stripping of diacritics, glottal stops, apostrophes or
// case. Exit code 0 when everything matches (allowed differences aside), 1
// on any mismatch or error.
import { createClient } from '@supabase/supabase-js'
import { ANATOMY_SPOTS } from '../src/practice/anatomyGameSpots.js'
import { MUNICIPALITIES } from '../src/data/municipalityGameNames.js'

// Known, reviewed differences between a static municipality entry and the
// database. Each is reported as ALLOWED with its reason instead of failing
// the check. field is 'name' (the CHamoru spelling, or no single matching
// row) or 'gloss' (the English). Remove an entry once it no longer applies;
// the script says when that happens.
const ALLOWED_DIFFS = [
  {
    id: 'chalan-pagu-otdot',
    field: 'name',
    reason: 'Approved composite name for the single map polygon. The Kumisión table lists CHålan Pågu and Otdot as separate rows.',
  },
  {
    id: 'mongmong-toto-maite',
    field: 'gloss',
    reason: 'Open question for the Kumisión: the source table English column reads Monmong-Toto-Maite, the static file reads Mongmong-Toto-Maite.',
  },
]

const nfc = (s) => (s ?? '').normalize('NFC')
const same = (a, b) => nfc(a) === nfc(b)

// Only for finding which Places row a respelled municipality name belongs
// to; it is never used to decide that two spellings match.
const looseKey = (s) => nfc(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’ʼʻ`]/g, '').toLowerCase().replace(/[\s-]+/g, ' ').trim()

let problems = 0
let allowed = 0
const usedAllowed = new Set()
const report = (line) => { problems++; console.log(`  MISMATCH  ${line}`) }
const ok = (line) => console.log(`  ok        ${line}`)

// A municipality difference: ALLOWED when listed in ALLOWED_DIFFS, otherwise
// a MISMATCH.
function flag(id, field, line) {
  const entry = ALLOWED_DIFFS.find((a) => a.id === id && a.field === field)
  if (!entry) return report(line)
  allowed++
  usedAllowed.add(entry)
  console.log(`  ALLOWED   ${line}\n            reason: ${entry.reason}`)
}

async function fetchVerified() {
  try {
    process.loadEnvFile(new URL('../.env', import.meta.url))
  } catch {
    throw new Error('Could not read .env next to package.json')
  }
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set in .env')

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('vocabulary')
      .select('id, chamorro, english, category')
      .eq('verified', true)
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Supabase read failed: ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

function checkAnatomy(rows) {
  console.log(`\nAnatomy (src/practice/anatomyGameSpots.js): ${ANATOMY_SPOTS.length} entries, matched by vocabulary id`)
  const byId = new Map(rows.map((r) => [r.id, r]))
  for (const s of ANATOMY_SPOTS) {
    const row = byId.get(s.id)
    if (!row) {
      report(`id ${s.id} "${s.chamorro}": no verified row returned (missing or not verified)`)
      continue
    }
    let clean = true
    if (!same(s.chamorro, row.chamorro)) {
      report(`id ${s.id} spelling: static "${s.chamorro}", database "${row.chamorro}"`)
      clean = false
    }
    if (!same(s.english, row.english)) {
      report(`id ${s.id} gloss: static "${s.english}", database "${row.english}"`)
      clean = false
    }
    if (clean) ok(`id ${s.id} ${s.chamorro} / ${s.english}`)
  }
}

// The municipality list has its own ids (such as 'hagatna'), not vocabulary
// ids, so each name is matched to a verified Places row by spelling: an
// exact match first, then a loose one, so a respelled name is reported as
// drift rather than as missing.
function checkMunicipalities(rows) {
  console.log(`\nMunicipalities (src/data/municipalityGameNames.js): ${MUNICIPALITIES.length} names, matched to verified rows in category Places by spelling`)
  const places = rows.filter((r) => r.category === 'Places')
  for (const m of MUNICIPALITIES) {
    let row = places.find((r) => same(r.chamorro, m.chamorro))
    if (!row) {
      row = places.find((r) => looseKey(r.chamorro) === looseKey(m.chamorro))
      if (row) {
        flag(m.id, 'name', `${m.id} spelling: static "${m.chamorro}", database id ${row.id} "${row.chamorro}"`)
      } else {
        const parts = m.chamorro.split('-').map(looseKey)
        const near = places.filter((r) => parts.includes(looseKey(r.chamorro)))
        const hint = near.length ? `; separate rows: ${near.map((r) => `id ${r.id} "${r.chamorro}"`).join(', ')}` : ''
        flag(m.id, 'name', `${m.id} "${m.chamorro}": no verified Places row with this name${hint}`)
        continue
      }
    }
    if (!same(m.english, row.english)) {
      flag(m.id, 'gloss', `${m.id} gloss: static "${m.english}", database id ${row.id} "${row.english}"`)
    } else if (same(m.chamorro, row.chamorro)) {
      ok(`${m.id} → id ${row.id} ${row.chamorro} / ${row.english}`)
    }
  }
  for (const a of ALLOWED_DIFFS) {
    if (!usedAllowed.has(a)) console.log(`  NOTE      ALLOWED_DIFFS entry for ${a.id} (${a.field}) no longer applies; remove it.`)
  }
}

try {
  const rows = await fetchVerified()
  console.log(`Read ${rows.length} verified vocabulary rows.`)
  checkAnatomy(rows)
  checkMunicipalities(rows)
  console.log(`\n${problems} mismatch${problems === 1 ? '' : 'es'}, ${allowed} allowed.`)
  process.exitCode = problems === 0 ? 0 : 1
} catch (err) {
  console.error(`check-static-names: ${err.message}`)
  process.exitCode = 1
}
