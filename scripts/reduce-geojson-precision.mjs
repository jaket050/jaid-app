// Reduce the generated Guåhan municipality GeoJSON in three steps (all lossless
// for display), rewriting src/data/guamMunicipalities.generated.js in place:
//   1. round every geometry coordinate to 4 decimal places (~11 m)
//   2. drop consecutive duplicate vertices (zero-length segments)
//   3. serialize compact (no indentation / one-number-per-line whitespace)
//
// Usage: node scripts/reduce-geojson-precision.mjs

import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DECIMALS = 4
const FACTOR = 10 ** DECIMALS

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, '..', 'src', 'data', 'guamMunicipalities.generated.js')

const kb = (bytes) => (bytes / 1024).toFixed(1) + ' KB'

const isPosition = (x) => Array.isArray(x) && typeof x[0] === 'number'
const isRing = (x) => Array.isArray(x) && x.length > 0 && isPosition(x[0])

// Round every number in the nested coordinate arrays.
function roundCoords(node) {
  if (typeof node === 'number') return Math.round(node * FACTOR) / FACTOR
  if (Array.isArray(node)) return node.map(roundCoords)
  return node
}

// Within each ring (array of [lng,lat] positions), drop points identical to
// their immediate predecessor — a zero-length segment, lossless for rendering.
function dedupeCoords(node) {
  if (isRing(node)) {
    const out = []
    for (const pt of node) {
      const prev = out[out.length - 1]
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) out.push(pt)
    }
    return out
  }
  if (Array.isArray(node)) return node.map(dedupeCoords)
  return node
}

function countVertices(node) {
  if (isPosition(node)) return 1
  if (Array.isArray(node)) return node.reduce((n, c) => n + countVertices(c), 0)
  return 0
}

const beforeBytes = statSync(DATA_PATH).size

// Strip the JS module wrapper: the exported object is the only {...} region,
// spanning from the first '{' to the last '}'.
const raw = readFileSync(DATA_PATH, 'utf8')
const objText = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
const data = JSON.parse(objText)

let vBefore = 0
let vAfter = 0
for (const feature of data.features ?? []) {
  const g = feature.geometry
  if (g && g.coordinates) {
    vBefore += countVertices(g.coordinates)
    g.coordinates = dedupeCoords(roundCoords(g.coordinates))
    vAfter += countVertices(g.coordinates)
  }
}

const out =
  '// AUTO-GENERATED — do not edit by hand.\n' +
  '// Run: node build-guam-map.mjs\n' +
  `export const guamMunicipalities = ${JSON.stringify(data)};\n`

writeFileSync(DATA_PATH, out)

const afterBytes = statSync(DATA_PATH).size

console.log(`Rounded to ${DECIMALS} decimals, dropped consecutive duplicate vertices, serialized compact.`)
console.log(`Vertices: ${vBefore} -> ${vAfter} (removed ${vBefore - vAfter})`)
console.log(`Before: ${kb(beforeBytes)}`)
console.log(`After:  ${kb(afterBytes)}`)
console.log(`Saved:  ${kb(beforeBytes - afterBytes)} (${(100 * (beforeBytes - afterBytes) / beforeBytes).toFixed(1)}%)`)
