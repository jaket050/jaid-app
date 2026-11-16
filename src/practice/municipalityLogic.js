// Municipality map game logic. Plain functions with no React, so the Node
// checks in scripts/check-municipality-logic.mjs can run them directly.
//
// Points are in map units (see municipalityMapData.js). `scale` is CSS px
// per map unit for the view that was tapped.
//
// The play rounds (start, tap, hint, next, completion) are the same as
// Anatomy Match and come from anatomyLogic.js unchanged.

import {
  INSET,
  INSET_REGION_IDS,
  LEVELS_WITH_INSET,
  LEVEL_FRAMES,
  LEVEL_REGION_IDS,
  REGIONS_BY_ID,
} from './municipalityMapData.js'

export {
  HINT_AFTER_MISSES,
  currentWordId,
  playReducer,
  shuffle,
  startPlay,
} from './anatomyLogic.js'

// Every region's tap area includes a circle at least this many px across,
// centered on its widest interior point.
export const MIN_TAP = 44

function inRings(x, y, rings) {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}

// True when the point is inside the region's shape (any of its pieces).
export function inRegion(region, x, y) {
  const b = region.bounds
  if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) return false
  return region.polygons.some((rings) => inRings(x, y, rings))
}

function poleDistance(region, x, y) {
  return Math.hypot(region.pole[0] - x, region.pole[1] - y)
}

// True when the point is in the region's tap area: its shape, or the
// 44px circle around its widest interior point.
export function inTapArea(region, x, y, scale) {
  return inRegion(region, x, y) || poleDistance(region, x, y) * scale <= MIN_TAP / 2
}

// Explore (and the region that flashes on a miss): the region whose shape
// is under the tap wins. If none is, the nearest region whose tap circle
// holds the tap wins. `regions` are the tappable regions. Null for a miss.
export function resolveExploreTap(regions, x, y, scale) {
  const under = regions.find((r) => inRegion(r, x, y))
  if (under) return under
  const near = regions.filter((r) => inTapArea(r, x, y, scale))
  if (near.length === 0) return null
  return near.reduce((best, r) => (poleDistance(r, x, y) < poleDistance(best, x, y) ? r : best))
}

// Play: a tap anywhere in the current place's tap area is correct, even if
// a neighbor's shape is under it. Otherwise it is a miss on the region
// Explore would pick. Null when the tap is on no tap area at all.
export function resolvePlayTap(regions, x, y, scale, targetId) {
  const target = regions.find((r) => r.id === targetId)
  if (target && inTapArea(target, x, y, scale)) return { correct: true, zone: target }
  const picked = resolveExploreTap(regions, x, y, scale)
  return picked ? { correct: false, zone: picked } : null
}

// Play by keyboard: the focused region is the answer.
export function playFromRegion(region, targetId) {
  return { correct: region.id === targetId, zone: region }
}

// ── Labels ────────────────────────────────────────────────────────────
// One label at a time (the place just found in Play, or the place selected
// in Explore): inside its place if the name fits with a small margin,
// otherwise right beside it. It may overlap neighboring places, but never
// the white outline of the zoomed area, the caption or the view's edge.
//
// "Show all names" and the Level complete screen: a place that can hold
// its name shows it inside; every other place gets a numbered dot, and a
// key lists the names. No lines.
//
// Label sizes are estimated from the name's length (municipality.css
// .muni-label), so placement can run before anything is drawn, and in Node.

const CHAR_WIDTH = 0.6 // average glyph width as a share of the font size
const LINE_HEIGHT = 1.25

// A long name may show on two lines, broken at one of its own hyphens or
// spaces nearest the middle. Every character stays: a hyphen ends the
// first line, a space becomes the line break.
export function labelLines(name, twoLines) {
  if (!twoLines) return [name]
  const chars = Array.from(name)
  let at = -1
  chars.forEach((c, i) => {
    if ((c === '-' || c === ' ') && i > 0 && i < chars.length - 1 &&
        (at < 0 || Math.abs(i - chars.length / 2) < Math.abs(at - chars.length / 2))) at = i
  })
  if (at < 0) return [name]
  const keep = chars[at] === '-' ? 1 : 0
  return [chars.slice(0, at + keep).join(''), chars.slice(at + 1).join('')]
}

export function labelSizePx(lines, fontPx) {
  // Plus the pill's padding and border.
  const longest = Math.max(...lines.map((l) => Array.from(l).length))
  return { w: longest * fontPx * CHAR_WIDTH + 20, h: lines.length * fontPx * LINE_HEIGHT + 10 }
}

// The ways a name can be set: one line, and two lines if it has a break.
function layouts(name) {
  const two = labelLines(name, true)
  return two.length > 1 ? [[name], two] : [[name]]
}

// Numbered dots are this many px across (white, navy edge, navy number).
export const NUMBER_DOT_PX = 24
const INSIDE_MARGIN_PX = 4
const GAP_PX = 2
const OUTLINE_CLEAR_PX = 4
const EDGE_CLEAR_PX = 2

// The "Zoomed in" caption's box in the zoomed view, in CSS px from its top
// left corner (municipality.css .muni-zoom-caption). It sits on open ocean.
export const CAPTION_PX = { x: 4, y: 4, w: 88, h: 24 }

export function boxesOverlap(a, b, pad = 0) {
  return a.x - pad < b.x + b.w && b.x - pad < a.x + a.w && a.y - pad < b.y + b.h && b.y - pad < a.y + a.h
}

// Do segments p1-p2 and p3-p4 cross?
function segmentsCross([x1, y1], [x2, y2], [x3, y3], [x4, y4]) {
  const d = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
  const d1 = d(x3, y3, x4, y4, x1, y1)
  const d2 = d(x3, y3, x4, y4, x2, y2)
  const d3 = d(x1, y1, x2, y2, x3, y3)
  const d4 = d(x1, y1, x2, y2, x4, y4)
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))
}

// Does segment a-b touch the box?
export function lineHitsBox(a, b, box) {
  const inside = ([x, y]) => x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h
  if (inside(a) || inside(b)) return true
  const c = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]]
  return c.some((p, i) => segmentsCross(a, b, p, c[(i + 1) % 4]))
}

// Point on the box's edge nearest to p: where a pointer line ends.
export function nearestOnBox([px, py], box) {
  return [
    Math.min(Math.max(px, box.x), box.x + box.w),
    Math.min(Math.max(py, box.y), box.y + box.h),
  ]
}

// Points spread over a box (corners, edges and inside).
function boxSamples(box, nx, ny) {
  const out = []
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) out.push([box.x + (box.w * i) / (nx - 1), box.y + (box.h * j) / (ny - 1)])
  }
  return out
}

// Does the box, grown by `margin` all round, lie wholly inside the region?
function fitsInside(region, box, margin) {
  const grown = { x: box.x - margin, y: box.y - margin, w: box.w + 2 * margin, h: box.h + 2 * margin }
  return boxSamples(grown, 9, 4).every(([x, y]) => inRegion(region, x, y))
}

function grow(box, by) {
  return { x: box.x - by, y: box.y - by, w: box.w + 2 * by, h: box.h + 2 * by }
}

// Does the box touch the outline's border lines (with a small clearance)?
export function touchesOutline(box, outline, clear = 0) {
  if (!outline) return false
  const o = outline
  const edges = [
    [[o.x, o.y], [o.x + o.w, o.y]], [[o.x + o.w, o.y], [o.x + o.w, o.y + o.h]],
    [[o.x + o.w, o.y + o.h], [o.x, o.y + o.h]], [[o.x, o.y + o.h], [o.x, o.y]],
  ]
  const g = grow(box, clear)
  return edges.some(([a, b]) => lineHitsBox(a, b, g))
}

function inFrame(box, frame, clear) {
  return box.x >= frame.x + clear && box.y >= frame.y + clear &&
    box.x + box.w <= frame.x + frame.w - clear && box.y + box.h <= frame.y + frame.h - clear
}

// The frame, outline and reserved boxes for one view of a level.
export function viewContext(level, kind, scale) {
  const hasInset = LEVELS_WITH_INSET.includes(level)
  const frame = kind === 'inset' ? INSET : LEVEL_FRAMES[level]
  const u = (px) => px / scale
  return {
    frame,
    scale,
    // The level's places: a label beside its place prefers not to cover them.
    places: LEVEL_REGION_IDS[level].map((id) => REGIONS_BY_ID.get(id)),
    outline: kind === 'main' && hasInset ? INSET : null,
    reserved: kind === 'inset'
      ? [{ x: frame.x + u(CAPTION_PX.x), y: frame.y + u(CAPTION_PX.y), w: u(CAPTION_PX.w), h: u(CAPTION_PX.h) }]
      : [],
  }
}

// Is a label box allowed in this view?
function boxAllowed(box, ctx) {
  const u = (px) => px / ctx.scale
  return inFrame(box, ctx.frame, u(EDGE_CLEAR_PX)) &&
    !touchesOutline(box, ctx.outline, u(OUTLINE_CLEAR_PX)) &&
    !ctx.reserved.some((r) => boxesOverlap(box, r, u(GAP_PX)))
}

// The region's name inside it, if it fits there with a margin and is
// allowed in the view. Returns { box, lines } or null. One line is tried
// before two.
export function insideLabel(region, ctx, fontPx) {
  const { scale } = ctx
  const m = INSIDE_MARGIN_PX / scale
  const [px, py] = region.pole
  const offsets = [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.6], [0, -0.6], [0.25, 0.6], [-0.25, 0.6], [0.25, -0.6], [-0.25, -0.6]]
  for (const lines of layouts(region.name)) {
    const size = labelSizePx(lines, fontPx)
    const w = size.w / scale
    const h = size.h / scale
    for (const [ox, oy] of offsets) {
      const box = { x: px - w / 2 + ox * w, y: py - h / 2 + oy * h, w, h }
      if (fitsInside(region, box, m) && boxAllowed(box, ctx)) return { box, lines }
    }
  }
  return null
}

const DIRECTIONS = Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12)
const BESIDE_PX = [2, 6, 12, 20, 30, 42, 56, 72, 92, 116, 144, 176, 214, 260, 320]

/**
 * The one label on screen: inside the place if it fits, otherwise close
 * beside it, preferring spots that cover less of the level's other places,
 * with a pointer line from the label to a dot on the place's widest point.
 * Returns { box, lines, inside, pointer: [[x1, y1], [x2, y2]] | null, forced }.
 */
export function singleLabel(region, ctx, fontPx) {
  const inside = insideLabel(region, ctx, fontPx)
  if (inside) return { ...inside, inside: true, pointer: null, forced: false }
  const u = (px) => px / ctx.scale
  const others = (ctx.places ?? []).filter((r) => r.id !== region.id)
  // The box's edge sits `dist` px beyond the place's widest circle.
  const r = region.poleWidth / 2
  let best = null
  for (const dist of BESIDE_PX) {
    for (const shape of layouts(region.name)) {
      const size = labelSizePx(shape, fontPx)
      const w = u(size.w)
      const h = u(size.h)
      for (const a of DIRECTIONS) {
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        const reach = r + u(dist) + Math.abs(cos) * (w / 2) + Math.abs(sin) * (h / 2)
        const box = { x: region.pole[0] + cos * reach - w / 2, y: region.pole[1] + sin * reach - h / 2, w, h }
        if (!boxAllowed(box, ctx)) continue
        const covered = boxSamples(box, 7, 3).filter(([x, y]) => others.some((o) => inRegion(o, x, y))).length
        // Close first, then less of the neighbors covered, then one line.
        const score = dist + covered * 4 + (shape.length > 1 ? 6 : 0) + Math.abs(sin) * 3
        if (!best || score < best.score) best = { score, box, lines: shape }
      }
    }
    // Stop at the first distance with a spot that covers nothing.
    if (best && best.score < dist + 10) break
  }
  if (best) {
    return { box: best.box, lines: best.lines, inside: false, pointer: [region.pole, nearestOnBox(region.pole, best.box)], forced: false }
  }
  const lines = [region.name]
  const size = labelSizePx(lines, fontPx)
  const w = u(size.w)
  const h = u(size.h)
  const f = ctx.frame
  const box = {
    x: Math.min(Math.max(region.pole[0] - w / 2, f.x), f.x + f.w - w),
    y: Math.min(Math.max(region.pole[1] - h / 2, f.y), f.y + f.h - h),
    w,
    h,
  }
  return { box, lines, inside: false, pointer: [region.pole, nearestOnBox(region.pole, box)], forced: true }
}

// "Show all names" on the All level may set a name smaller, down to these
// sizes, before falling back to a number. Largest size that fits wins.
export const ALL_LEVEL_FONTS = { desktop: [18, 17, 16, 15], phone: [15, 14, 13] }

/**
 * "Show all names" for one view: names inside where they fit, numbered
 * dots for the rest. `fonts` lists the sizes to try, largest first.
 * Returns { named: [{ id, box, lines, fontPx }], numbered: [{ id, x, y,
 * forced }] }; dot centers are on their own place.
 */
export function showAllLayout(regions, ctx, fonts) {
  const u = (px) => px / ctx.scale
  const named = []
  const rest = []
  for (const r of regions) {
    let fit = null
    for (const fontPx of fonts) {
      fit = insideLabel(r, ctx, fontPx)
      if (fit) {
        named.push({ id: r.id, ...fit, fontPx })
        break
      }
    }
    if (!fit) rest.push(r)
  }
  const half = u(NUMBER_DOT_PX / 2)
  const place = (order) => {
    const taken = [...named.map((n) => n.box), ...ctx.reserved]
    const numbered = []
    for (const r of order) {
      let spot = null
      // The widest point first, then other points of the place nearby.
      const step = u(3)
      for (let ring = 0; ring <= 40 && !spot; ring++) {
        const n = ring === 0 ? 1 : 8 * ring
        for (let k = 0; k < n && !spot; k++) {
          const a = (k / n) * 2 * Math.PI
          const x = r.pole[0] + Math.cos(a) * ring * step
          const y = r.pole[1] + Math.sin(a) * ring * step
          if (!inRegion(r, x, y)) continue
          const box = { x: x - half, y: y - half, w: 2 * half, h: 2 * half }
          if (!boxAllowed(box, ctx)) continue
          if (taken.some((t) => boxesOverlap(box, t, u(GAP_PX)))) continue
          spot = { x, y, box }
        }
      }
      if (spot) {
        numbered.push({ id: r.id, x: spot.x, y: spot.y, forced: false })
        taken.push(spot.box)
      } else {
        numbered.push({ id: r.id, x: r.pole[0], y: r.pole[1], forced: true })
      }
    }
    return numbered
  }
  // The smallest places choose first: they have the fewest spots. A place
  // left without a spot moves to the front and the dots are placed again.
  let order = [...rest].sort((a, b) => a.poleWidth - b.poleWidth)
  let numbered = place(order)
  for (let tries = 0; tries < 6 && numbered.some((d) => d.forced); tries++) {
    const stuck = new Set(numbered.filter((d) => d.forced).map((d) => d.id))
    order = [...order.filter((r) => stuck.has(r.id)), ...order.filter((r) => !stuck.has(r.id))]
    numbered = place(order)
  }
  return { named, numbered }
}

// ── Views ─────────────────────────────────────────────────────────────

// Which places a view labels: in levels with the zoomed view, the places
// whose widest point is in the zoomed area are labeled there.
export function labelsInView(level, kind, ids) {
  const hasInset = LEVELS_WITH_INSET.includes(level)
  const zoomed = (id) => hasInset && INSET_REGION_IDS.includes(id)
  return ids.filter((id) => (kind === 'inset' ? zoomed(id) : !zoomed(id)))
}

// The numbers for "Show all names" run north to south (then west to east)
// across both views of a level.
export function numberOrder(ids) {
  return [...ids].sort((a, b) => {
    const pa = REGIONS_BY_ID.get(a).pole
    const pb = REGIONS_BY_ID.get(b).pole
    return pa[1] - pb[1] || pa[0] - pb[0]
  })
}

// ── Zoom lines ────────────────────────────────────────────────────────
// Two thin lines from the white outline on the main map to the zoomed view,
// joining the outline's corners on the side that faces the zoomed view to
// the zoomed view's nearest corners.
export function zoomLinePairs(a, b) {
  const tl = (r) => [r.x, r.y]
  const tr = (r) => [r.x + r.w, r.y]
  const bl = (r) => [r.x, r.y + r.h]
  const br = (r) => [r.x + r.w, r.y + r.h]
  if (b.x + b.w <= a.x) return [[tl(a), tr(b)], [bl(a), br(b)]] // zoomed view to the left
  if (b.x >= a.x + a.w) return [[tr(a), tl(b)], [br(a), bl(b)]] // to the right
  if (b.y >= a.y + a.h) return [[bl(a), tl(b)], [br(a), tr(b)]] // below
  return [[tl(a), bl(b)], [tr(a), br(b)]] // above
}
