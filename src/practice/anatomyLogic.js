// Anatomy Match game logic. Plain functions with no React, so the Node checks
// in scripts/check-anatomy-logic.mjs can run them directly.
//
// Points and sizes are CSS px inside one image box of width W and height H.
// Zone shapes are percentages of that box (see anatomyZones.js).

// Every zone's tap area is at least this many px across, centered on the
// zone, even where the drawn shape is smaller.
export const MIN_TAP = 44

function ellipsePx(shape, W, H) {
  return {
    cx: (shape.cx / 100) * W,
    cy: (shape.cy / 100) * H,
    rx: (shape.w / 200) * W,
    ry: (shape.h / 200) * H,
  }
}

function polygonPx(shape, W, H) {
  return shape.points.map(([x, y]) => [(x / 100) * W, (y / 100) * H])
}

function bounds(pts) {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

function inEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx
  const dy = (py - cy) / ry
  return dx * dx + dy * dy <= 1
}

function inPolygon(px, py, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Center of the zone in px.
export function zoneCenter(zone, W, H) {
  const s = zone.shape
  if (s.type === 'ellipse') {
    const m = ellipsePx(s, W, H)
    return { x: m.cx, y: m.cy }
  }
  const b = bounds(polygonPx(s, W, H))
  return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 }
}

// Drawn area in px², used to find the smallest zone under a tap.
export function zoneArea(zone, W, H) {
  const s = zone.shape
  if (s.type === 'ellipse') {
    const m = ellipsePx(s, W, H)
    return Math.PI * m.rx * m.ry
  }
  const pts = polygonPx(s, W, H)
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  }
  return Math.abs(a / 2)
}

// True when the point is inside the drawn shape.
export function inShape(zone, x, y, W, H) {
  const s = zone.shape
  if (s.type === 'ellipse') {
    const m = ellipsePx(s, W, H)
    return inEllipse(x, y, m.cx, m.cy, m.rx, m.ry)
  }
  return inPolygon(x, y, polygonPx(s, W, H))
}

// True when the point is inside the enlarged tap area: the ellipse with each
// radius grown to at least MIN_TAP / 2, or for a polygon its bounding box
// grown to at least MIN_TAP each way. This matches the zone button's box.
export function inTapArea(zone, x, y, W, H) {
  const s = zone.shape
  const half = MIN_TAP / 2
  if (s.type === 'ellipse') {
    const m = ellipsePx(s, W, H)
    return inEllipse(x, y, m.cx, m.cy, Math.max(m.rx, half), Math.max(m.ry, half))
  }
  const b = bounds(polygonPx(s, W, H))
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  const hw = Math.max((b.x1 - b.x0) / 2, half)
  const hh = Math.max((b.y1 - b.y0) / 2, half)
  return Math.abs(x - cx) <= hw && Math.abs(y - cy) <= hh
}

function distTo(zone, x, y, W, H) {
  const c = zoneCenter(zone, W, H)
  return Math.hypot(c.x - x, c.y - y)
}

// Every word whose drawn shape contains the point, smallest first, each
// with its smallest zone there: [{ wordId, zoneId }].
function wordsUnder(zones, x, y, W, H) {
  const seen = new Set()
  const out = []
  const inside = zones
    .filter((z) => inShape(z, x, y, W, H))
    .sort((a, b) => zoneArea(a, W, H) - zoneArea(b, W, H))
  for (const z of inside) {
    if (seen.has(z.wordId)) continue
    seen.add(z.wordId)
    out.push({ wordId: z.wordId, zoneId: z.id })
  }
  return out
}

// The Explore result for a chosen zone and the words at that spot.
// `under` lists every word at the spot (the chosen one included), so a word
// picked from "Also here" can be swapped in without losing the others.
function exploreResult(zone, under) {
  const list = under.some((u) => u.wordId === zone.wordId)
    ? under
    : [{ wordId: zone.wordId, zoneId: zone.id }, ...under]
  return {
    zone,
    under: list,
    alsoHere: list.filter((u) => u.wordId !== zone.wordId).map((u) => u.wordId),
  }
}

// Explore: the smallest zone whose drawn shape contains the tap wins. If no
// drawn shape does, the nearest zone whose enlarged tap area does wins.
// `zones` are the zones on the tapped image. Returns null for a miss.
export function resolveExploreTap(zones, x, y, W, H) {
  const under = wordsUnder(zones, x, y, W, H)
  if (under.length > 0) {
    return exploreResult(zones.find((z) => z.id === under[0].zoneId), under)
  }
  const near = zones.filter((z) => inTapArea(z, x, y, W, H))
  if (near.length === 0) return null
  const zone = near.reduce((best, z) => (distTo(z, x, y, W, H) < distTo(best, x, y, W, H) ? z : best))
  return exploreResult(zone, [])
}

// Explore by keyboard: the focused zone, with the other words at its center.
export function exploreFromZone(zones, zone, W, H) {
  const c = zoneCenter(zone, W, H)
  return exploreResult(zone, wordsUnder(zones, c.x, c.y, W, H))
}

// Explore: a word picked from "Also here" becomes the selection, at the same
// spot. Returns null if the word is not at that spot.
export function pickAlsoHere(zones, result, wordId) {
  const entry = result.under.find((u) => u.wordId === wordId)
  if (!entry) return null
  return exploreResult(zones.find((z) => z.id === entry.zoneId), result.under)
}

// Play: a tap inside the current word's enlarged tap area is correct, even
// when other zones are under it too. Otherwise it is a miss on the zone
// Explore would pick. Returns null when the tap is on no zone at all.
export function resolvePlayTap(zones, x, y, W, H, targetWordId) {
  const target = zones.filter((z) => z.wordId === targetWordId && inTapArea(z, x, y, W, H))
  if (target.length > 0) {
    const zone = target.reduce((best, z) => (distTo(z, x, y, W, H) < distTo(best, x, y, W, H) ? z : best))
    return { correct: true, zone }
  }
  const picked = resolveExploreTap(zones, x, y, W, H)
  return picked ? { correct: false, zone: picked.zone } : null
}

// Play by keyboard: the focused zone is the answer.
export function playFromZone(zone, targetWordId) {
  return { correct: zone.wordId === targetWordId, zone }
}

// Fisher–Yates shuffle with an injectable random source.
export function shuffle(items, rng = Math.random) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ── Play rounds ───────────────────────────────────────────────────────
// status: 'asking' (waiting for a tap), 'correct' (found, waiting for Next
// word) or 'complete' (every word found). `found` maps word id to the id of
// the zone that was tapped, so its label sits on that side.

export const HINT_AFTER_MISSES = 2

export function startPlay(wordIds, rng = Math.random) {
  return {
    order: shuffle(wordIds, rng),
    index: 0,
    found: {},
    misses: 0,
    hint: false,
    wrong: false,
    status: 'asking',
  }
}

export function currentWordId(state) {
  return state.status === 'complete' ? null : state.order[state.index]
}

export function playReducer(state, action) {
  switch (action.type) {
    case 'tap': {
      if (state.status !== 'asking' || !action.result) return state
      const { correct, zone } = action.result
      if (correct) {
        const found = { ...state.found, [state.order[state.index]]: zone.id }
        const done = Object.keys(found).length === state.order.length
        return { ...state, found, wrong: false, status: done ? 'complete' : 'correct' }
      }
      const misses = state.misses + 1
      return { ...state, misses, wrong: true, hint: state.hint || misses >= HINT_AFTER_MISSES }
    }
    case 'hint':
      if (state.status !== 'asking') return state
      return { ...state, hint: true }
    case 'next':
      if (state.status !== 'correct') return state
      return { ...state, index: state.index + 1, misses: 0, hint: false, wrong: false, status: 'asking' }
    default:
      return state
  }
}

// ── Labels ────────────────────────────────────────────────────────────
// Labels sit just outside the figure on the side of the tapped zone. With
// two figures side by side, the front figure's right labels and the back
// figure's left labels share the gutter between them.

export function labelColumn(zone, images) {
  const i = images.indexOf(zone.image)
  if (zone.side === 'left') return i === 0 ? 'outer-left' : `between-${i - 1}`
  return i === images.length - 1 ? 'outer-right' : `between-${i}`
}

// "Show all names": one zone per word in the level to hang its label on.
// A word with one zone uses it. For a word with several, the zone whose
// label column has the fewest labels so far wins, so the sides stay even.
export function showAllZones(zones, images) {
  const byWord = new Map()
  for (const z of zones) {
    if (!byWord.has(z.wordId)) byWord.set(z.wordId, [])
    byWord.get(z.wordId).push(z)
  }
  const counts = {}
  const picked = []
  const add = (z) => {
    const col = labelColumn(z, images)
    counts[col] = (counts[col] ?? 0) + 1
    picked.push(z)
  }
  const groups = [...byWord.values()]
  groups.filter((g) => g.length === 1).forEach((g) => add(g[0]))
  const avgY = (g) => g.reduce((t, z) => t + z.shape.cy, 0) / g.length
  groups
    .filter((g) => g.length > 1)
    .sort((a, b) => avgY(a) - avgY(b))
    .forEach((g) => {
      add(g.reduce((best, z) => (
        (counts[labelColumn(z, images)] ?? 0) < (counts[labelColumn(best, images)] ?? 0) ? z : best
      )))
    })
  return picked
}

// Spreads labels in each column so they are at least `gap` apart (all in
// percent of the image height), staying between minY and maxY.
// items: [{ key, column, y }]. Returns { [key]: y }.
export function layoutLabels(items, gap, minY = 0, maxY = 100) {
  const out = {}
  const columns = {}
  for (const it of items) (columns[it.column] ??= []).push(it)
  for (const list of Object.values(columns)) {
    const sorted = [...list].sort((a, b) => a.y - b.y)
    const ys = sorted.map((it) => it.y)
    for (let i = 0; i < ys.length; i++) {
      ys[i] = Math.max(ys[i], minY, i > 0 ? ys[i - 1] + gap : -Infinity)
    }
    for (let i = ys.length - 1; i >= 0; i--) {
      ys[i] = Math.min(ys[i], maxY, i < ys.length - 1 ? ys[i + 1] - gap : Infinity)
    }
    sorted.forEach((it, i) => { out[it.key] = ys[i] })
  }
  return out
}
