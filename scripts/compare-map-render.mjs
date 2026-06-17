// Render the I Tåno' municipality map from two versions of the GeoJSON data
// (current working tree vs commit 2ad6e49) using the SAME d3-geo projection the
// GuahanMap component uses, rasterize each to PNG via sharp, and pixel-diff them.
// Read-only: old data is pulled via `git show`, working tree is not touched.

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { geoMercator, geoPath } from 'd3-geo'
import sharp from 'sharp'

const W = 440
const H = 720
const OLD_REF = '2ad6e49'
const DATA_REL = 'src/data/guamMunicipalities.generated.js'

function extract(text) {
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
}

const dataNew = extract(readFileSync(DATA_REL, 'utf8'))
const dataOld = extract(
  execSync(`git show ${OLD_REF}:${DATA_REL}`, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
)

// Match the component's .municipality styling + centroid dots so the rasterized
// image reflects what the page draws (shapes, borders, all 19 dots).
function renderSvg(data) {
  const projection = geoMercator().fitSize([W, H], data)
  const path = geoPath(projection)
  const shapes = data.features
    .map((f) => `<path d="${path(f)}" fill="rgba(136,233,168,0.75)" stroke="#5a9e5a" stroke-width="0.9"/>`)
    .join('')
  const dots = data.features
    .map((f) => {
      const [x, y] = projection(f.properties.centroidLngLat)
      return `<circle cx="${x}" cy="${y}" r="4" fill="#172b1a" stroke="#fff7e8" stroke-width="2"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0A3D6E"/>${shapes}${dots}</svg>`
}

const OUT_OLD = '/tmp/guam-map-old.png'
const OUT_NEW = '/tmp/guam-map-new.png'

await sharp(Buffer.from(renderSvg(dataOld))).png().toFile(OUT_OLD)
await sharp(Buffer.from(renderSvg(dataNew))).png().toFile(OUT_NEW)

// Objective pixel diff at identical dimensions.
const a = await sharp(OUT_OLD).ensureAlpha().raw().toBuffer()
const b = await sharp(OUT_NEW).ensureAlpha().raw().toBuffer()
let changedPixels = 0
const channels = 4
for (let i = 0; i < a.length; i += channels) {
  let d = 0
  for (let c = 0; c < channels; c++) d = Math.max(d, Math.abs(a[i + c] - b[i + c]))
  if (d > 16) changedPixels++
}
const totalPixels = a.length / channels

console.log(`Features: old=${dataOld.features.length}, new=${dataNew.features.length}`)
console.log(`Wrote ${OUT_OLD} and ${OUT_NEW} (${W}x${H})`)
console.log(`Changed pixels (>16/255 on any channel): ${changedPixels} / ${totalPixels} (${(100 * changedPixels / totalPixels).toFixed(3)}%)`)
