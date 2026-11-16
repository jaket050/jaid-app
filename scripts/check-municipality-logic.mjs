// Node checks for the Municipalities map game logic. No test runner needed:
//   node scripts/check-municipality-logic.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { guamMunicipalities } from '../src/data/guamMunicipalities.generated.js'
import { MUNICIPALITIES } from '../src/data/municipalityGameNames.js'
import {
  INSET,
  INSET_REGION_IDS,
  LEVELS_WITH_INSET,
  LEVEL_FRAMES,
  LEVEL_ORDER,
  LEVEL_REGION_IDS,
  MUNICIPALITY_LEVELS,
  REGIONS,
  REGIONS_BY_ID,
  SHADES,
} from '../src/practice/municipalityMapData.js'
import {
  ALL_LEVEL_FONTS,
  CAPTION_PX,
  MIN_TAP,
  NUMBER_DOT_PX,
  boxesOverlap,
  currentWordId,
  inRegion,
  insideLabel,
  labelsInView,
  numberOrder,
  playFromRegion,
  playReducer,
  resolveExploreTap,
  resolvePlayTap,
  showAllLayout,
  singleLabel,
  startPlay,
  touchesOutline,
  viewContext,
  zoomLinePairs,
} from '../src/practice/municipalityLogic.js'

let passed = 0
function check(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ok  ${name}`)
  } catch (err) {
    console.error(`  FAIL  ${name}\n        ${err.message}`)
    process.exitCode = 1
  }
}

const region = (id) => REGIONS_BY_ID.get(id)
const levelRegions = (lvl) => LEVEL_REGION_IDS[lvl].map(region)
function seeded(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

// Layout model mirroring municipality.css: view sizes in CSS px for a level
// at a window width (1180 means 1180 by 820).
function viewSizes(level, vw) {
  const phone = vw <= 700
  const CW = phone ? vw - 24 - 2 - 16 : vw - 48 - 340 - 20 - 2 - 32
  const HB = phone ? Infinity : 820 - 150
  const f = LEVEL_FRAMES[level]
  const fit = (availW, maxH, ar) => { const h = Math.min(maxH, availW / ar); return { w: h * ar, h } }
  const ar = f.w / f.h
  const iar = INSET.w / INSET.h
  if (!LEVELS_WITH_INSET.includes(level)) return { main: fit(CW, HB, ar) }
  if (phone) return { main: fit(CW, HB, ar), inset: fit(CW - 4, HB, iar) }
  if (level === 'central') return { main: fit(CW, (HB - 12) * 0.35, ar), inset: fit(CW - 4, (HB - 12) * 0.65, iar) }
  return { main: fit(CW * 0.6, HB, ar), inset: fit(CW * 0.4 - 16, HB, iar) }
}
function scalesFor(level, vw) {
  const v = viewSizes(level, vw)
  return { main: v.main.w / LEVEL_FRAMES[level].w, inset: v.inset ? v.inset.w / INSET.w : 0 }
}
// The view a region is best tapped in: the inset when its level has one.
const usesInset = (lvl, id) => LEVELS_WITH_INSET.includes(lvl) && INSET_REGION_IDS.includes(id)

// Land colors from municipality.css, so the checks follow the stylesheet.
const CSS = readFileSync(new URL('../src/practice/municipality.css', import.meta.url), 'utf8')
const SHADE_COLORS = [0, 1, 2, 3].map((n) => CSS.match(new RegExp(`muni-region--shade-${n} \\{ fill: (#[0-9A-Fa-f]{6})`))[1])
const BORDER = CSS.match(/\.muni-region \{[^}]*stroke: (#[0-9A-Fa-f]{6})/)[1]
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
// Neighbors: places sharing at least two boundary points in the shape data.
function neighborPairs() {
  const owners = new Map()
  for (const f of guamMunicipalities.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
      const k = `${x},${y}`
      if (!owners.has(k)) owners.set(k, new Set())
      owners.get(k).add(f.properties.id)
    }
  }
  const counts = new Map()
  for (const set of owners.values()) {
    const ids = [...set].sort()
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const k = `${ids[i]}|${ids[j]}`
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  return [...counts].filter(([, n]) => n >= 2).map(([k]) => k.split('|'))
}

console.log('Data')

check('19 regions, one per name, matched by id', () => {
  assert.equal(REGIONS.length, 19)
  assert.equal(MUNICIPALITIES.length, 19)
  assert.deepEqual(REGIONS.map((r) => r.id).sort(), MUNICIPALITIES.map((m) => m.id).sort())
})

check('every name shown is the stored name, character for character', () => {
  for (const m of MUNICIPALITIES) {
    assert.equal(region(m.id).name, m.chamorro, m.id)
    const feature = guamMunicipalities.features.find((f) => f.properties.id === m.id)
    assert.equal(feature.properties.displayName, m.chamorro, `${m.id} map name`)
  }
})

check('levels: North 3, Central 9, South 7, every region exactly once; All is all 19', () => {
  assert.equal(MUNICIPALITY_LEVELS.north.length, 3)
  assert.equal(MUNICIPALITY_LEVELS.central.length, 9)
  assert.equal(MUNICIPALITY_LEVELS.south.length, 7)
  const ids = [...MUNICIPALITY_LEVELS.north, ...MUNICIPALITY_LEVELS.central, ...MUNICIPALITY_LEVELS.south]
  assert.equal(new Set(ids).size, 19)
  assert.deepEqual([...ids].sort(), REGIONS.map((r) => r.id).sort())
  assert.equal(LEVEL_REGION_IDS.all.length, 19)
})

check('each widest interior point is inside its region', () => {
  for (const r of REGIONS) assert.ok(inRegion(r, r.pole[0], r.pole[1]), r.id)
})

check('the inset holds the six central cluster regions', () => {
  assert.deepEqual([...INSET_REGION_IDS].sort(), [
    'agana-heights-tutuhan', 'assan-maina', 'chalan-pagu-otdot', 'hagatna', 'mongmong-toto-maite', 'sinahanna',
  ])
})

check('every level frame holds all of its regions', () => {
  for (const lvl of LEVEL_ORDER) {
    const f = LEVEL_FRAMES[lvl]
    for (const r of levelRegions(lvl)) {
      const b = r.bounds
      assert.ok(b.x >= f.x && b.y >= f.y && b.x + b.w <= f.x + f.w && b.y + b.h <= f.y + f.h, `${lvl} ${r.id}`)
    }
  }
})

check('no two neighboring places share a land shade', () => {
  const pairs = neighborPairs()
  assert.ok(pairs.length > 30, 'precondition: neighbors found')
  for (const [a, b] of pairs) assert.notEqual(SHADES[a], SHADES[b], `${a} and ${b}`)
})

const FOUND = CSS.match(/\.muni-region--found \{ fill: (#[0-9A-Fa-f]{6})/)[1]
const MUTED = CSS.match(/\.muni-region--out \{\s*fill: (#[0-9A-Fa-f]{6})/)[1]
const FLASH = CSS.match(/\.muni-hl--flash \.muni-hl__ring \{\s*fill: (#[0-9A-Fa-f]{6})/)[1]
// CIELAB color difference (Delta E 1976), for colors of similar lightness.
function lab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]))

check('the found color is clearly different from every land shade, the muted color and the correct flash', () => {
  for (const c of SHADE_COLORS) assert.ok(contrast(FOUND, c) >= 1.8, `${FOUND} vs ${c}: ${contrast(FOUND, c).toFixed(2)}`)
  assert.ok(contrast(FOUND, FLASH) >= 3, `vs flash ${contrast(FOUND, FLASH).toFixed(2)}`)
  assert.ok(deltaE(FOUND, MUTED) >= 25, `vs muted: Delta E ${deltaE(FOUND, MUTED).toFixed(0)}`)
})

check('the four land shades share one hue (within 12 degrees) and stay apart', () => {
  const hue = (hex) => { const [, a, b] = lab(hex); return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 }
  const hues = SHADE_COLORS.map(hue)
  assert.ok(Math.max(...hues) - Math.min(...hues) <= 12, `hues ${hues.map((h) => h.toFixed(0)).join(', ')}`)
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      assert.ok(deltaE(SHADE_COLORS[i], SHADE_COLORS[j]) >= 7, `${SHADE_COLORS[i]} vs ${SHADE_COLORS[j]}`)
    }
  }
})

check('every land shade is clearly different from the correct flash, the found color and the muted color', () => {
  for (const c of SHADE_COLORS) {
    assert.ok(deltaE(c, FLASH) >= 12, `${c} vs flash: Delta E ${deltaE(c, FLASH).toFixed(1)}`)
    assert.ok(contrast(c, FOUND) >= 1.8, `${c} vs found: ${contrast(c, FOUND).toFixed(2)}`)
    assert.ok(deltaE(c, MUTED) >= 25, `${c} vs muted: Delta E ${deltaE(c, MUTED).toFixed(0)}`)
  }
})

check('borders reach 3:1 against every land shade', () => {
  for (const c of SHADE_COLORS) assert.ok(contrast(BORDER, c) >= 3, `${BORDER} on ${c}: ${contrast(BORDER, c).toFixed(2)}`)
})

console.log('Taps')

for (const lvl of LEVEL_ORDER) {
  for (const vw of [375, 1180]) {
    check(`${lvl} at ${vw}: a tap on each place's center finds it, in Explore and Play`, () => {
      const s = scalesFor(lvl, vw)
      for (const r of levelRegions(lvl)) {
        const scale = usesInset(lvl, r.id) ? s.inset : s.main
        assert.equal(resolveExploreTap(levelRegions(lvl), r.pole[0], r.pole[1], scale).id, r.id)
        const play = resolvePlayTap(levelRegions(lvl), r.pole[0], r.pole[1], scale, r.id)
        assert.equal(play.correct, true, r.id)
      }
    })
  }
}

check('Play overlap rule: inside the target\'s tap circle counts, even over a neighbor\'s shape', () => {
  const regions = levelRegions('central')
  const scale = scalesFor('central', 375).inset
  const t = region('hagatna')
  const r = (MIN_TAP / 2 - 1) / scale
  let found = null
  for (let a = 0; a < 360 && !found; a += 5) {
    const x = t.pole[0] + r * Math.cos((a * Math.PI) / 180)
    const y = t.pole[1] + r * Math.sin((a * Math.PI) / 180)
    const other = regions.find((o) => o.id !== t.id && inRegion(o, x, y))
    if (other) found = { x, y, other }
  }
  assert.ok(found, 'precondition: a neighbor shape inside the circle')
  assert.equal(resolvePlayTap(regions, found.x, found.y, scale, 'hagatna').correct, true)
  assert.equal(resolveExploreTap(regions, found.x, found.y, scale).id, found.other.id)
})

check('a wrong tap is a miss on the place tapped', () => {
  const regions = levelRegions('central')
  const b = region('barigada')
  const r = resolvePlayTap(regions, b.pole[0], b.pole[1], scalesFor('central', 1180).main, 'piti')
  assert.equal(r.correct, false)
  assert.equal(r.zone.id, 'barigada')
})

check('taps on the ocean or on a place outside the level do nothing (not a miss)', () => {
  const north = levelRegions('north')
  const s = scalesFor('north', 375).main
  const f = LEVEL_FRAMES.north
  assert.equal(resolvePlayTap(north, f.x + 2, f.y + 2, s, 'yigu'), null)
  const piti = region('piti')
  assert.equal(resolveExploreTap(north, piti.pole[0], piti.pole[1], s), null)
  const malesso = region('malesso')
  assert.equal(resolvePlayTap(levelRegions('central'), malesso.pole[0], malesso.pole[1], 1, 'piti'), null)
})

check('keyboard: the focused place is the answer', () => {
  assert.equal(playFromRegion(region('yigu'), 'yigu').correct, true)
  assert.equal(playFromRegion(region('yigu'), 'dedidu').correct, false)
})

check('the four smallest places have separate 44px circles in the inset at 375', () => {
  const s = scalesFor('central', 375).inset
  const ids = ['hagatna', 'agana-heights-tutuhan', 'sinahanna', 'mongmong-toto-maite']
  for (const a of ids) {
    for (const b of ids) {
      if (a >= b) continue
      const d = Math.hypot(region(a).pole[0] - region(b).pole[0], region(a).pole[1] - region(b).pole[1]) * s
      assert.ok(d >= MIN_TAP, `${a} and ${b} are ${d.toFixed(0)}px apart`)
    }
  }
})

// Share of each place's 44px circle where a tap picks that place under the
// Explore rule (in Play the whole circle counts for the current place).
function ownShare(lvl, id, scale) {
  const regions = levelRegions(lvl)
  const t = region(id)
  const rad = MIN_TAP / 2 / scale
  let total = 0
  let own = 0
  for (let i = -10; i <= 10; i++) {
    for (let j = -10; j <= 10; j++) {
      const dx = (i / 10) * rad
      const dy = (j / 10) * rad
      if (dx * dx + dy * dy > rad * rad) continue
      total++
      if (resolveExploreTap(regions, t.pole[0] + dx, t.pole[1] + dy, scale)?.id === id) own++
    }
  }
  return own / total
}

for (const lvl of LEVEL_ORDER) {
  check(`${lvl} at 375: in Explore, every place wins at least 60% of its own 44px circle`, () => {
    const s = scalesFor(lvl, 375)
    for (const id of LEVEL_REGION_IDS[lvl]) {
      const share = ownShare(lvl, id, usesInset(lvl, id) ? s.inset : s.main)
      assert.ok(share >= 0.6, `${id}: ${(share * 100).toFixed(0)}%`)
    }
  })
}

console.log('Play rounds')

for (const lvl of LEVEL_ORDER) {
  const ids = LEVEL_REGION_IDS[lvl]
  check(`${lvl}: completes after all ${ids.length} places are found`, () => {
    let s = startPlay(ids, seeded(3))
    for (let i = 0; i < ids.length; i++) {
      const t = currentWordId(s)
      s = playReducer(s, { type: 'tap', result: { correct: true, zone: region(t) } })
      if (i < ids.length - 1) s = playReducer(s, { type: 'next' })
    }
    assert.equal(s.status, 'complete')
    assert.equal(Object.keys(s.found).length, ids.length)
  })
}

check('hint after two misses; the star is still earned', () => {
  const ids = LEVEL_REGION_IDS.central
  let s = startPlay(ids, seeded(9))
  const t = currentWordId(s)
  const wrong = region(ids.find((id) => id !== t))
  s = playReducer(s, { type: 'tap', result: { correct: false, zone: wrong } })
  assert.equal(s.hint, false)
  s = playReducer(s, { type: 'tap', result: { correct: false, zone: wrong } })
  assert.equal(s.hint, true)
  s = playReducer(s, { type: 'tap', result: { correct: true, zone: region(t) } })
  assert.equal(s.found[t], t)
})

console.log('Labels')

const allViews = (lvl, vw) => {
  const sc = scalesFor(lvl, vw)
  const out = [['main', sc.main]]
  if (sc.inset) out.push(['inset', sc.inset])
  return out.map(([kind, scale]) => ({ kind, scale, ctx: viewContext(lvl, kind, scale) }))
}
const inFrameBox = (b, f) => b.x >= f.x && b.y >= f.y && b.x + b.w <= f.x + f.w && b.y + b.h <= f.y + f.h

check(`numbered dots are at least 22px across`, () => assert.ok(NUMBER_DOT_PX >= 22))

check('All level sizes: down to 15px on desktop and 13px on phones, largest first', () => {
  assert.deepEqual(ALL_LEVEL_FONTS.desktop, [18, 17, 16, 15])
  assert.deepEqual(ALL_LEVEL_FONTS.phone, [15, 14, 13])
})

for (const lvl of LEVEL_ORDER) {
  for (const vw of [375, 1180]) {
    const fontPx = vw <= 700 ? 15 : 18
    const views = allViews(lvl, vw)

    check(`${lvl} at ${vw}: one label at a time sits inside its place when it fits, otherwise beside it, never on the outline, caption or edge`, () => {
      for (const { kind, ctx } of views) {
        for (const id of labelsInView(lvl, kind, LEVEL_REGION_IDS[lvl])) {
          const r = region(id)
          const l = singleLabel(r, ctx, fontPx)
          assert.ok(!l.forced, `${kind} ${id}: no allowed spot`)
          assert.ok(inFrameBox(l.box, ctx.frame), `${kind} ${id}: outside the view`)
          assert.ok(!touchesOutline(l.box, ctx.outline), `${kind} ${id}: on the outline`)
          assert.ok(!ctx.reserved.some((c) => boxesOverlap(l.box, c)), `${kind} ${id}: on the caption`)
          assert.equal(l.inside, insideLabel(r, ctx, fontPx) !== null, `${kind} ${id}: inside when it fits`)
          if (l.inside) {
            assert.equal(l.pointer, null)
          } else {
            // Beside its place: a pointer from a dot on the place to the label.
            const [[px, py], [ex, ey]] = l.pointer
            assert.ok(inRegion(r, px, py), `${kind} ${id}: pointer does not start on the place`)
            const b = l.box
            const onEdge = (Math.abs(ex - b.x) < 1e-6 || Math.abs(ex - b.x - b.w) < 1e-6 || Math.abs(ey - b.y) < 1e-6 || Math.abs(ey - b.y - b.h) < 1e-6)
            assert.ok(onEdge && ex >= b.x - 1e-6 && ex <= b.x + b.w + 1e-6 && ey >= b.y - 1e-6 && ey <= b.y + b.h + 1e-6, `${kind} ${id}: pointer does not reach the label`)
          }
        }
      }
    })

    check(`${lvl} at ${vw}: Show all names names every place once, inside or numbered, with no overlaps and nothing on the outline`, () => {
      const seenIds = []
      for (const { kind, scale, ctx } of views) {
        const regs = labelsInView(lvl, kind, LEVEL_REGION_IDS[lvl]).map(region)
        const fonts = lvl === 'all' ? ALL_LEVEL_FONTS[vw <= 700 ? 'phone' : 'desktop'] : [fontPx]
        const { named, numbered } = showAllLayout(regs, ctx, fonts)
        const half = NUMBER_DOT_PX / 2 / scale
        const boxes = [
          ...named.map((n) => ({ id: n.id, box: n.box })),
          ...numbered.map((d) => ({ id: d.id, box: { x: d.x - half, y: d.y - half, w: 2 * half, h: 2 * half } })),
          ...ctx.reserved.map((box) => ({ id: 'caption', box })),
        ]
        for (const n of named) {
          assert.ok(fonts.includes(n.fontPx), `${kind} ${n.id}: size ${n.fontPx}`)
          assert.ok(insideLabel(region(n.id), ctx, n.fontPx), `${kind} ${n.id}: named but does not fit`)
          // The largest size that fits.
          for (const bigger of fonts.filter((f) => f > n.fontPx)) {
            assert.equal(insideLabel(region(n.id), ctx, bigger), null, `${kind} ${n.id}: ${bigger}px fits`)
          }
        }
        for (const d of numbered) {
          for (const f of fonts) assert.equal(insideLabel(region(d.id), ctx, f), null, `${kind} ${d.id}: fits at ${f}px but is numbered`)
        }
        for (const d of numbered) {
          assert.ok(!d.forced, `${kind} ${d.id}: no spot for its number`)
          assert.ok(inRegion(region(d.id), d.x, d.y), `${kind} ${d.id}: number not on its place`)
        }
        for (let i = 0; i < boxes.length; i++) {
          assert.ok(inFrameBox(boxes[i].box, ctx.frame), `${kind} ${boxes[i].id}: outside the view`)
          assert.ok(!touchesOutline(boxes[i].box, ctx.outline), `${kind} ${boxes[i].id}: on the outline`)
          for (let j = i + 1; j < boxes.length; j++) {
            assert.ok(!boxesOverlap(boxes[i].box, boxes[j].box), `${kind}: ${boxes[i].id} overlaps ${boxes[j].id}`)
          }
        }
        seenIds.push(...named.map((n) => n.id), ...numbered.map((d) => d.id))
      }
      assert.deepEqual([...seenIds].sort(), [...LEVEL_REGION_IDS[lvl]].sort())
    })
  }
}

// Zoom lines, in the layout model: the views placed as municipality.css
// places them, the line from each outline corner traced over the main map.
function zoomLayout(lvl, vw) {
  const v = viewSizes(lvl, vw)
  const phone = vw <= 700
  if (lvl === 'all' && !phone) {
    // Zoomed view (with its 2px border) on the left, centered in the row.
    const H = Math.max(v.main.h, v.inset.h + 4)
    const inset = { x: 0, y: (H - v.inset.h - 4) / 2, w: v.inset.w + 4, h: v.inset.h + 4 }
    const main = { x: inset.w + 12, y: (H - v.main.h) / 2, w: v.main.w, h: v.main.h }
    return { main, inset }
  }
  const W = Math.max(v.main.w, v.inset.w + 4)
  const main = { x: (W - v.main.w) / 2, y: 0, w: v.main.w, h: v.main.h }
  const inset = { x: (W - v.inset.w - 4) / 2, y: v.main.h + 12, w: v.inset.w + 4, h: v.inset.h + 4 }
  return { main, inset }
}

for (const lvl of LEVELS_WITH_INSET) {
  for (const vw of [375, 1180]) {
    check(`${lvl} at ${vw}: the zoom lines never cross the North places on the main map`, () => {
      const { main, inset } = zoomLayout(lvl, vw)
      const f = LEVEL_FRAMES[lvl]
      const toPx = ([x, y]) => [main.x + ((x - f.x) / f.w) * main.w, main.y + ((y - f.y) / f.h) * main.h]
      const toMap = ([x, y]) => [f.x + ((x - main.x) / main.w) * f.w, f.y + ((y - main.y) / main.h) * f.h]
      const [ox, oy] = toPx([INSET.x, INSET.y])
      const [ox2, oy2] = toPx([INSET.x + INSET.w, INSET.y + INSET.h])
      const outline = { x: ox, y: oy, w: ox2 - ox, h: oy2 - oy }
      const north = MUNICIPALITY_LEVELS.north.map(region)
      for (const [a, b] of zoomLinePairs(outline, inset)) {
        for (let k = 0; k <= 400; k++) {
          const t = k / 400
          const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
          if (p[0] < main.x || p[0] > main.x + main.w || p[1] < main.y || p[1] > main.y + main.h) continue
          const [mx, my] = toMap(p)
          const hit = north.find((r) => inRegion(r, mx, my))
          assert.ok(!hit, `line crosses ${hit?.id}`)
        }
      }
    })
  }
}

check('numbers run north to south, then west to east', () => {
  const order = numberOrder(LEVEL_REGION_IDS.all)
  for (let i = 1; i < order.length; i++) {
    const a = region(order[i - 1]).pole
    const b = region(order[i]).pole
    assert.ok(a[1] < b[1] || (a[1] === b[1] && a[0] <= b[0]), `${order[i - 1]} before ${order[i]}`)
  }
})

for (const lvl of LEVELS_WITH_INSET) {
  for (const vw of [375, 1180]) {
    check(`${lvl} at ${vw}: the "Zoomed in" caption sits on open ocean, clear of the map`, () => {
      const ctx = viewContext(lvl, 'inset', scalesFor(lvl, vw).inset)
      const c = ctx.reserved[0]
      for (let i = 0; i <= 16; i++) {
        for (let j = 0; j <= 8; j++) {
          const x = c.x + (c.w * i) / 16
          const y = c.y + (c.h * j) / 8
          assert.ok(!REGIONS.some((r) => inRegion(r, x, y)), `land under the caption at ${x.toFixed(1)}, ${y.toFixed(1)}`)
        }
      }
    })
  }
}

check('the caption box matches the view it is reserved in', () => {
  const ctx = viewContext('central', 'inset', 3)
  assert.equal(ctx.reserved.length, 1)
  assert.ok(Math.abs(ctx.reserved[0].w * 3 - CAPTION_PX.w) < 1e-9)
  assert.equal(viewContext('north', 'main', 2).outline, null)
})

check('labels for the central cluster show in the zoomed view on Central and All, and on the main map elsewhere', () => {
  assert.deepEqual(labelsInView('central', 'inset', LEVEL_REGION_IDS.central).sort(), [...INSET_REGION_IDS].sort())
  assert.equal(labelsInView('central', 'main', LEVEL_REGION_IDS.central).length, 3)
  assert.equal(labelsInView('north', 'main', LEVEL_REGION_IDS.north).length, 3)
})

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`)
