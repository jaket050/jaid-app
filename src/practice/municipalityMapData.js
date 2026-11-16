// Municipality map game data: levels, map frames, the central inset and
// each region's tap circle center. Names come from municipalityGameNames.js
// by id and shapes from guamMunicipalities.generated.js; neither is edited.
//
// All positions are in "map units": the projection below fits the island
// into a 440 by 720 box (the same projection the old game used).

import { geoMercator, geoPath } from 'd3-geo'
import { guamMunicipalities } from '../data/guamMunicipalities.generated.js'
import { MUNICIPALITIES } from '../data/municipalityGameNames.js'

// ── Levels ─────────────────────────────────────────────────────────────
// Region ids per level, in the order they are listed to the learner.
// Change the grouping here. "all" is every region and is built below.
export const MUNICIPALITY_LEVELS = {
  north: ['yigu', 'dedidu', 'tamuneng-tomhom'],
  central: [
    'hagatna', 'agana-heights-tutuhan', 'sinahanna', 'mongmong-toto-maite',
    'assan-maina', 'piti', 'chalan-pagu-otdot', 'barigada', 'mangilao',
  ],
  south: ['yona', 'santa-rita-sumai', 'hagat', 'talofofo', 'inalahan', 'humatak', 'malesso'],
}

export const LEVEL_ORDER = ['north', 'central', 'south', 'all']
export const LEVEL_NAMES = { north: 'North', central: 'Central', south: 'South', all: 'All' }

// Levels that show the zoomed inset of the central cluster.
export const LEVELS_WITH_INSET = ['central', 'all']

// The zoomed view of the central cluster, where the smallest regions are.
// Its top left corner is open ocean, where the "Zoomed in" caption sits.
export const INSET = { x: 120, y: 298, w: 112, h: 96 }

// Regions labeled in the zoomed view instead of the main map.
export const INSET_REGION_IDS = [
  'hagatna', 'agana-heights-tutuhan', 'sinahanna', 'mongmong-toto-maite', 'assan-maina', 'chalan-pagu-otdot',
]

// Land shade (0 to 3) per region, so no two neighbors share a shade.
// Colors are in municipality.css (.muni-region--shade-N); the Node checks
// confirm neighbors differ.
export const SHADES = {
  'dedidu': 0,
  'yigu': 1,
  'tamuneng-tomhom': 2,
  'hagatna': 1,
  'barigada': 1,
  'mongmong-toto-maite': 0,
  'agana-heights-tutuhan': 3,
  'assan-maina': 0,
  'sinahanna': 2,
  'piti': 3,
  'mangilao': 2,
  'chalan-pagu-otdot': 1,
  'santa-rita-sumai': 1,
  'yona': 2,
  'hagat': 2,
  'talofofo': 0,
  'humatak': 1,
  'inalahan': 2,
  'malesso': 0,
}

// Each region's widest interior point (x, y) and the width of the largest
// circle that fits inside it there, in map units. This is the center of its
// 44px tap circle and of its found dot. Computed offline from the shapes;
// scripts/check-municipality-logic.mjs confirms each point is inside.
export const POLES = {
  'dedidu': [293.3, 230.8, 84],
  'yigu': [376.6, 189, 83.6],
  'tamuneng-tomhom': [216.7, 292, 26.6],
  'hagatna': [177.1, 321.5, 10.8],
  'barigada': [253.5, 317.3, 51.1],
  'mongmong-toto-maite': [200.3, 323.6, 22.8],
  'agana-heights-tutuhan': [167, 336.2, 14],
  'assan-maina': [137, 341.4, 38.5],
  'sinahanna': [188.4, 339, 15.4],
  'piti': [92, 360.6, 53],
  'mangilao': [298.7, 308.4, 39.5],
  'chalan-pagu-otdot': [200.8, 364.6, 33.6],
  'santa-rita-sumai': [99.4, 434.1, 58.4],
  'yona': [165.2, 410.9, 76],
  'hagat': [66, 481.9, 56.6],
  'talofofo': [136.6, 500.6, 49.7],
  'humatak': [73.8, 555.4, 31.2],
  'inalahan': [138.8, 571.9, 57.7],
  'malesso': [86.4, 594.5, 33.1],
}

// ── Regions ────────────────────────────────────────────────────────────

const projection = geoMercator().fitSize([440, 720], guamMunicipalities)
const pathGen = geoPath(projection)
const NAME_BY_ID = new Map(MUNICIPALITIES.map((m) => [m.id, m.chamorro]))

// { id, name, d (SVG path), polygons (projected rings), bounds, pole, poleWidth, shade }
export const REGIONS = guamMunicipalities.features.map((feature) => {
  const id = feature.properties.id
  const coords = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates
  const [[x0, y0], [x1, y1]] = pathGen.bounds(feature)
  const [px, py, width] = POLES[id]
  return {
    id,
    name: NAME_BY_ID.get(id),
    d: pathGen(feature),
    polygons: coords.map((poly) => poly.map((ring) => ring.map((pt) => projection(pt)))),
    bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    pole: [px, py],
    poleWidth: width,
    shade: SHADES[id],
  }
})

export const REGIONS_BY_ID = new Map(REGIONS.map((r) => [r.id, r]))

export const LEVEL_REGION_IDS = {
  ...MUNICIPALITY_LEVELS,
  all: LEVEL_ORDER.slice(0, 3).flatMap((lvl) => MUNICIPALITY_LEVELS[lvl]),
}

// ── Frames ─────────────────────────────────────────────────────────────
// Each level's main map is zoomed to its own regions plus a margin of
// ocean for labels. The rest of the island shows faded at the edges.

function frameAround(ids, margin) {
  const bs = ids.map((id) => REGIONS_BY_ID.get(id).bounds)
  const x0 = Math.min(...bs.map((b) => b.x))
  const y0 = Math.min(...bs.map((b) => b.y))
  const x1 = Math.max(...bs.map((b) => b.x + b.w))
  const y1 = Math.max(...bs.map((b) => b.y + b.h))
  const m = margin * Math.max(x1 - x0, y1 - y0)
  return { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m }
}

export const LEVEL_FRAMES = Object.fromEntries(
  LEVEL_ORDER.map((lvl) => [lvl, frameAround(LEVEL_REGION_IDS[lvl], 0.08)])
)
