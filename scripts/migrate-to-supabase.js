#!/usr/bin/env node
/**
 * One-time migration: Railway PostgreSQL → Supabase PostgreSQL.
 *
 * Required env vars (exported in your shell before running):
 *   DATABASE_URL          — Railway PG connection string (source)
 *   SUPABASE_DATABASE_URL — Supabase PG connection string (destination)
 *
 * Behavior:
 *   - Auto-discovers source column names (vocabulary table).
 *   - Creates destination `vocabulary` table if it doesn't exist.
 *   - Inserts each row with ON CONFLICT (id) DO NOTHING — idempotent.
 *   - For every inserted row: source = 'Kumision i Fino CHamoru', verified = false.
 *   - Syncs the Supabase id sequence to MAX(id) at the end so future inserts
 *     don't collide with migrated ids.
 *
 * Run:
 *   export DATABASE_URL='...'
 *   export SUPABASE_DATABASE_URL='...'
 *   node scripts/migrate-to-supabase.js
 */
import pg from 'pg'

const REQUIRED = ['DATABASE_URL', 'SUPABASE_DATABASE_URL']

function checkEnv() {
  const missing = REQUIRED.filter((v) => !process.env[v])
  if (missing.length) {
    console.error('✗ Missing required env vars:', missing.join(', '))
    process.exit(1)
  }
}

function pickField(row, candidates) {
  for (const k of candidates) {
    if (row[k] !== undefined) return row[k]
  }
  return null
}

async function main() {
  checkEnv()

  const { Client } = pg

  const railway = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  const supabase = new Client({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log('→ Connecting to Railway…')
    await railway.connect()

    console.log('→ Discovering source schema (vocabulary)…')
    const colsResult = await railway.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'vocabulary' AND table_schema = 'public'
       ORDER BY ordinal_position`
    )
    const srcCols = colsResult.rows.map((r) => r.column_name)
    if (srcCols.length === 0) {
      throw new Error("Source table 'vocabulary' not found in Railway (public schema).")
    }
    console.log('  Source columns:', srcCols.join(', '))

    console.log('→ Exporting rows from Railway…')
    const { rows } = await railway.query('SELECT * FROM vocabulary ORDER BY id')
    console.log(`  Exported ${rows.length} rows.`)

    console.log('→ Connecting to Supabase…')
    await supabase.connect()

    console.log('→ Ensuring destination table exists (CREATE TABLE IF NOT EXISTS)…')
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id SERIAL PRIMARY KEY,
        chamorro VARCHAR(255) NOT NULL,
        english VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'Word',
        difficulty INTEGER DEFAULT 1,
        category VARCHAR(100),
        cultural_note TEXT,
        source VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('→ Inserting rows into Supabase…')
    let inserted = 0
    let skipped = 0
    let warned = 0

    for (const row of rows) {
      if (!row.chamorro || !row.english) {
        console.warn(`  ⚠ Skipping row id=${row.id}: missing chamorro/english (NOT NULL in destination).`)
        warned++
        continue
      }

      const culturalNote = pickField(row, [
        'cultural_note',
        'culturalnote',
        'culturalNote',
      ])

      const result = await supabase.query(
        `INSERT INTO vocabulary
           (id, chamorro, english, type, difficulty, category, cultural_note, source, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.chamorro,
          row.english,
          row.type,
          row.difficulty,
          row.category,
          culturalNote,
          'Kumision i Fino CHamoru',
          false,
        ]
      )

      if (result.rowCount === 1) inserted++
      else skipped++
    }

    console.log('→ Syncing id sequence to MAX(id) on destination…')
    await supabase.query(
      `SELECT setval(
         pg_get_serial_sequence('vocabulary', 'id'),
         COALESCE((SELECT MAX(id) FROM vocabulary), 1),
         (SELECT MAX(id) FROM vocabulary) IS NOT NULL
       )`
    )

    console.log('---')
    console.log(`✓ Done.`)
    console.log(`  Inserted:                          ${inserted}`)
    console.log(`  Skipped (already exist):           ${skipped}`)
    console.log(`  Skipped (NULL chamorro/english):   ${warned}`)
    console.log(`  Total source rows:                 ${rows.length}`)
  } catch (err) {
    console.error('✗ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    await railway.end().catch(() => {})
    await supabase.end().catch(() => {})
  }
}

main()
