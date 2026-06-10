#!/usr/bin/env node
/**
 * Generate the Open Graph / Twitter card image from the existing hero photo.
 *
 * Input:  public/tumon-bay.jpg (~4.2 MB)
 * Output: public/og-image.jpg (1200 × 630, JPEG, target < 300 KB)
 *
 * Crop strategy: cover with center-bottom anchor (Tumon Bay framing
 * keeps the shoreline in view at the OG aspect).
 *
 * Run:
 *   node scripts/generate-og-image.mjs
 */
import sharp from 'sharp'
import { stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC = resolve(ROOT, 'public/tumon-bay.jpg')
const OUT = resolve(ROOT, 'public/og-image.jpg')

const TARGET_BYTES = 300 * 1024
const WIDTH = 1200
const HEIGHT = 630

async function tryQuality(quality) {
  const buf = await sharp(SRC)
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'centre' })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toBuffer()
  return buf
}

async function main() {
  try {
    await stat(SRC)
  } catch {
    console.error(`✗ Source not found: ${SRC}`)
    process.exit(1)
  }

  // Step quality down until under target bytes.
  for (const q of [85, 80, 75, 70, 65, 60, 55, 50]) {
    const buf = await tryQuality(q)
    console.log(`  quality=${q} → ${(buf.length / 1024).toFixed(1)} KB`)
    if (buf.length <= TARGET_BYTES) {
      await sharp(buf).toFile(OUT)
      console.log(`✓ Wrote ${OUT} (quality=${q}, ${(buf.length / 1024).toFixed(1)} KB)`)
      return
    }
  }

  // Fell through — write the smallest we managed at quality=50.
  const buf = await tryQuality(50)
  await sharp(buf).toFile(OUT)
  console.warn(`⚠ Could not reach <${TARGET_BYTES / 1024} KB target. Wrote at q=50, ${(buf.length / 1024).toFixed(1)} KB.`)
}

main().catch((err) => {
  console.error('✗ Failed:', err.message)
  process.exit(1)
})
