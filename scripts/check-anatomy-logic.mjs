// Node checks for the Anatomy Match game logic. No test runner needed:
//   node scripts/check-anatomy-logic.mjs
import assert from 'node:assert/strict'
import { ANATOMY_SPOTS } from '../src/practice/anatomyGameSpots.js'
import { ANATOMY_LEVELS, ANATOMY_WORD_LEVEL, ANATOMY_ZONES } from '../src/practice/anatomyZones.js'
import {
  HINT_AFTER_MISSES,
  MIN_TAP,
  currentWordId,
  exploreFromZone,
  inShape,
  inTapArea,
  labelColumn,
  layoutLabels,
  pickAlsoHere,
  playFromZone,
  playReducer,
  resolveExploreTap,
  resolvePlayTap,
  showAllZones,
  shuffle,
  startPlay,
  zoneCenter,
} from '../src/practice/anatomyLogic.js'

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

const byId = (id) => {
  const z = ANATOMY_ZONES.find((zone) => zone.id === id)
  assert.ok(z, `no zone ${id}`)
  return z
}
const onImage = (image) => ANATOMY_ZONES.filter((z) => z.image === image)
const WORD = Object.fromEntries(ANATOMY_SPOTS.map((s) => [s.english, s.id]))
const ENGLISH = Object.fromEntries(ANATOMY_SPOTS.map((s) => [s.id, s.english]))
// Image sizes in CSS px: phone (375 wide) and 1180 by 820.
const SIZES = {
  face: [[235, 235], [578, 578]],
  body: [[116, 349], [246, 738]],
}
const centerOf = (id, W, H) => zoneCenter(byId(id), W, H)
// A seeded random source, so shuffles repeat.
function seeded(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
// A cheek on the face image: inside Face and Head, clear of every feature.
const cheek = (W, H) => ({ x: 0.36 * W, y: 0.66 * H })

console.log('Data and levels')

check('22 words, each with at least one zone, and no zone without a word', () => {
  assert.equal(ANATOMY_SPOTS.length, 22)
  const spotIds = new Set(ANATOMY_SPOTS.map((s) => s.id))
  const zoneWordIds = new Set(ANATOMY_ZONES.map((z) => z.wordId))
  assert.deepEqual([...spotIds].sort(), [...zoneWordIds].sort())
})

check('all of a word\'s zones are in one level', () => {
  for (const z of ANATOMY_ZONES) {
    const level = ANATOMY_WORD_LEVEL[z.wordId]
    assert.ok(ANATOMY_LEVELS[level].images.includes(z.image), `${z.id} on ${z.image}`)
  }
})

const levelWords = (lvl) => ANATOMY_SPOTS.filter((s) => ANATOMY_WORD_LEVEL[s.id] === lvl).map((s) => s.english)

check('Face level: 13 words, including Head, Hair, Face and Neck', () => {
  assert.deepEqual(levelWords('face').sort(), [
    'Chin', 'Ear', 'Eye', 'Eyeball', 'Eyebrow', 'Eyelashes', 'Face',
    'Forehead', 'Hair', 'Head', 'Mouth', 'Neck', 'Nose',
  ])
})

check('Body level: 9 words', () => {
  assert.deepEqual(levelWords('body').sort(), [
    'Back', 'Buttocks', 'Chest', 'Feet', 'Fingers', 'Hand', 'Knee', 'Stomach', 'Thigh',
  ])
})

check('front figure has no Head, Hair, Face or Neck zones', () => {
  const front = onImage('front').map((z) => ENGLISH[z.wordId])
  for (const w of ['Head', 'Hair', 'Face', 'Neck']) assert.ok(!front.includes(w), w)
})

check('back figure has only Back and Buttocks', () => {
  assert.deepEqual(onImage('back').map((z) => ENGLISH[z.wordId]).sort(), ['Back', 'Buttocks'])
})

check('zone ids are unique and every zone lies inside its image', () => {
  assert.equal(new Set(ANATOMY_ZONES.map((z) => z.id)).size, ANATOMY_ZONES.length)
  for (const z of ANATOMY_ZONES) {
    const s = z.shape
    assert.ok(s.cx - s.w / 2 >= 0 && s.cx + s.w / 2 <= 100, `${z.id} x`)
    assert.ok(s.cy - s.h / 2 >= 0 && s.cy + s.h / 2 <= 100, `${z.id} y`)
  }
})

console.log('Play: the overlap rule')

for (const [W, H] of SIZES.face) {
  check(`face ${W}px: Eyeball target, tap on the iris (inside Eye too) is correct`, () => {
    const c = centerOf('eyeball-l', W, H)
    const r = resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Eyeball)
    assert.equal(r.correct, true)
    assert.equal(r.zone.wordId, WORD.Eyeball)
  })

  check(`face ${W}px: Eye target, tap on the iris (inside Eyeball too) is correct`, () => {
    const c = centerOf('eyeball-r', W, H)
    const r = resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Eye)
    assert.equal(r.correct, true)
    assert.equal(r.zone.id, 'eye-r')
  })

  check(`face ${W}px: Head target, tap on the nose is correct (Nose and Face also under it)`, () => {
    const c = centerOf('nose', W, H)
    const r = resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Head)
    assert.equal(r.correct, true)
    assert.equal(r.zone.id, 'head')
  })

  check(`face ${W}px: Face target, tap on the mouth is correct; Nose target there is a miss on Mouth`, () => {
    const c = centerOf('mouth', W, H)
    assert.equal(resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Face).correct, true)
    const r = resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Nose)
    assert.equal(r.correct, false)
    assert.equal(r.zone.id, 'mouth')
  })

  check(`face ${W}px: Neck target, tap below the chin is correct`, () => {
    const c = centerOf('neck', W, H)
    assert.equal(resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Neck).correct, true)
  })
}

check('face 578px: Eyelashes target, tap on the iris is outside the lash tap area, so a miss on Eyeball', () => {
  const [W, H] = SIZES.face[1]
  const c = centerOf('eyeball-l', W, H)
  assert.equal(inTapArea(byId('eyelashes-l'), c.x, c.y, W, H), false)
  const r = resolvePlayTap(onImage('face'), c.x, c.y, W, H, WORD.Eyelashes)
  assert.equal(r.correct, false)
  assert.equal(r.zone.id, 'eyeball-l')
})

check('a tap on a body area with no zone (the back figure\'s head) does nothing, not a miss', () => {
  for (const [W, H] of SIZES.body) {
    assert.equal(resolvePlayTap(onImage('back'), W * 0.5, H * 0.15, W, H, WORD.Back), null)
    assert.equal(resolveExploreTap(onImage('back'), W * 0.5, H * 0.15, W, H), null)
  }
})

check('a tap on the front figure\'s head, which has no zone now, does nothing', () => {
  const [W, H] = SIZES.body[1]
  assert.equal(resolvePlayTap(onImage('front'), W * 0.5, H * 0.14, W, H, WORD.Chest), null)
})

check('keyboard: the focused zone is the answer', () => {
  assert.equal(playFromZone(byId('nose'), WORD.Nose).correct, true)
  assert.equal(playFromZone(byId('eye-l'), WORD.Eyeball).correct, false)
})

console.log('Play: paired parts count on either side')

for (const [ids, word] of [
  [['ear-l', 'ear-r'], 'Ear'],
  [['eye-l', 'eye-r'], 'Eye'],
  [['eyebrow-l', 'eyebrow-r'], 'Eyebrow'],
  [['hair-top', 'hair-l', 'hair-l-low', 'hair-r', 'hair-r-low'], 'Hair'],
  [['hand-f-l', 'hand-f-r'], 'Hand'],
  [['fingers-f-l', 'fingers-f-r'], 'Fingers'],
  [['thigh-l', 'thigh-r'], 'Thigh'],
  [['knee-l', 'knee-r'], 'Knee'],
  [['feet-f-l', 'feet-f-r'], 'Feet'],
]) {
  check(`${word}: every zone counts`, () => {
    for (const id of ids) {
      const z = byId(id)
      const [W, H] = z.image === 'face' ? SIZES.face[1] : SIZES.body[1]
      const c = zoneCenter(z, W, H)
      const r = resolvePlayTap(onImage(z.image), c.x, c.y, W, H, WORD[word])
      assert.equal(r.correct, true, id)
      assert.equal(r.zone.id, id)
    }
  })
}

console.log('Explore: the smallest zone wins')

for (const [W, H] of SIZES.face) {
  check(`face ${W}px: tap on the cheek shows Face, with Head under Also here`, () => {
    const { x, y } = cheek(W, H)
    const r = resolveExploreTap(onImage('face'), x, y, W, H)
    assert.equal(r.zone.id, 'face')
    assert.deepEqual(r.alsoHere, [WORD.Head])
  })

  check(`face ${W}px: tap on the hair at the left shows Hair, with Head under Also here`, () => {
    const c = centerOf('hair-l', W, H)
    const r = resolveExploreTap(onImage('face'), c.x, c.y, W, H)
    assert.equal(r.zone.wordId, WORD.Hair)
    assert.deepEqual(r.alsoHere, [WORD.Head])
  })

  check(`face ${W}px: every smaller feature wins over Face, Hair and Head at its center`, () => {
    for (const id of ['forehead', 'eyebrow-l', 'eyebrow-r', 'eyelashes-l', 'eyelashes-r', 'eyeball-l',
      'eyeball-r', 'ear-l', 'ear-r', 'nose', 'mouth', 'chin', 'neck']) {
      const c = centerOf(id, W, H)
      assert.equal(resolveExploreTap(onImage('face'), c.x, c.y, W, H).zone.id, id)
    }
  })
}

check('tap on the iris shows Eyeball, with Eye, Face and Head under Also here', () => {
  const [W, H] = SIZES.face[1]
  const c = centerOf('eyeball-l', W, H)
  const r = resolveExploreTap(onImage('face'), c.x, c.y, W, H)
  assert.equal(r.zone.id, 'eyeball-l')
  assert.deepEqual(r.alsoHere, [WORD.Eye, WORD.Face, WORD.Head])
})

check('tap on the fingers shows Fingers, with Hand under Also here', () => {
  const [W, H] = SIZES.body[1]
  const c = centerOf('fingers-f-r', W, H)
  const r = resolveExploreTap(onImage('front'), c.x, c.y, W, H)
  assert.equal(r.zone.id, 'fingers-f-r')
  assert.deepEqual(r.alsoHere, [WORD.Hand])
})

check('phone: a tap just below the knee shape, inside no shape, picks Knee by its tap area', () => {
  const [W, H] = SIZES.body[0]
  const z = byId('knee-l')
  const c = zoneCenter(z, W, H)
  const y = c.y + (z.shape.h / 200) * H + 3
  assert.ok(onImage('front').every((o) => !inShape(o, c.x, y, W, H)), 'precondition: no shape here')
  const r = resolveExploreTap(onImage('front'), c.x, y, W, H)
  assert.equal(r.zone.id, 'knee-l')
  assert.deepEqual(r.alsoHere, [])
})

check('keyboard Explore: the focused zone, with words at its center', () => {
  const [W, H] = SIZES.face[1]
  const r = exploreFromZone(onImage('face'), byId('eye-r'), W, H)
  assert.equal(r.zone.id, 'eye-r')
  assert.deepEqual(r.alsoHere, [WORD.Eyeball, WORD.Face, WORD.Head])
})

check(`every tap area is at least ${MIN_TAP}px across, even on a phone`, () => {
  for (const z of ANATOMY_ZONES) {
    const [W, H] = z.image === 'face' ? SIZES.face[0] : SIZES.body[0]
    const c = zoneCenter(z, W, H)
    const h = MIN_TAP / 2 - 0.01
    for (const [dx, dy] of [[h, 0], [-h, 0], [0, h], [0, -h]]) {
      assert.ok(inTapArea(z, c.x + dx, c.y + dy, W, H), `${z.id} at ${dx},${dy}`)
    }
  }
})

console.log('Explore: Also here')

check('picking Head from Also here selects the Head zone and lists Face instead', () => {
  const [W, H] = SIZES.face[1]
  const { x, y } = cheek(W, H)
  const first = resolveExploreTap(onImage('face'), x, y, W, H)
  const picked = pickAlsoHere(onImage('face'), first, WORD.Head)
  assert.equal(picked.zone.id, 'head')
  assert.deepEqual(picked.alsoHere, [WORD.Face])
  const again = pickAlsoHere(onImage('face'), picked, WORD.Face)
  assert.equal(again.zone.id, 'face')
  assert.deepEqual(again.alsoHere, [WORD.Head])
})

check('picking from Also here on the iris reaches Eye, Face and Head', () => {
  const [W, H] = SIZES.face[1]
  const c = centerOf('eyeball-l', W, H)
  const first = resolveExploreTap(onImage('face'), c.x, c.y, W, H)
  const eye = pickAlsoHere(onImage('face'), first, WORD.Eye)
  assert.equal(eye.zone.id, 'eye-l')
  assert.deepEqual(eye.alsoHere, [WORD.Eyeball, WORD.Face, WORD.Head])
  assert.equal(pickAlsoHere(onImage('face'), first, WORD.Face).zone.id, 'face')
  assert.equal(pickAlsoHere(onImage('face'), first, WORD.Head).zone.id, 'head')
})

check('a word that is not at the spot cannot be picked', () => {
  const [W, H] = SIZES.face[1]
  const { x, y } = cheek(W, H)
  const first = resolveExploreTap(onImage('face'), x, y, W, H)
  assert.equal(pickAlsoHere(onImage('face'), first, WORD.Nose), null)
})

console.log('Play rounds: hints and completion')

const FACE_IDS = ANATOMY_SPOTS.filter((s) => ANATOMY_WORD_LEVEL[s.id] === 'face').map((s) => s.id)
const BODY_IDS = ANATOMY_SPOTS.filter((s) => ANATOMY_WORD_LEVEL[s.id] === 'body').map((s) => s.id)
const zoneFor = (wordId) => ANATOMY_ZONES.find((z) => z.wordId === wordId)
const wrongFor = (wordId, ids) => zoneFor(ids.find((id) => id !== wordId))

check('shuffle keeps every word once and repeats with the same seed', () => {
  const a = shuffle(FACE_IDS, seeded(7))
  assert.deepEqual([...a].sort(), [...FACE_IDS].sort())
  assert.deepEqual(a, shuffle(FACE_IDS, seeded(7)))
})

check(`hint appears after ${HINT_AFTER_MISSES} misses, not after 1`, () => {
  let s = startPlay(FACE_IDS, seeded(1))
  const t = currentWordId(s)
  s = playReducer(s, { type: 'tap', result: { correct: false, zone: wrongFor(t, FACE_IDS) } })
  assert.equal(s.misses, 1)
  assert.equal(s.wrong, true)
  assert.equal(s.hint, false)
  s = playReducer(s, { type: 'tap', result: { correct: false, zone: wrongFor(t, FACE_IDS) } })
  assert.equal(s.misses, 2)
  assert.equal(s.hint, true)
  assert.equal(s.status, 'asking')
  s = playReducer(s, { type: 'tap', result: { correct: true, zone: zoneFor(t) } })
  assert.equal(s.status, 'correct')
  assert.equal(s.found[t], zoneFor(t).id, 'star still earned after misses')
})

check('Show me a hint with no misses shows the hint and records no miss', () => {
  let s = startPlay(FACE_IDS, seeded(2))
  s = playReducer(s, { type: 'hint' })
  assert.equal(s.hint, true)
  assert.equal(s.misses, 0)
})

check('Next word clears misses and the hint, and moves on', () => {
  let s = startPlay(FACE_IDS, seeded(3))
  const t = currentWordId(s)
  s = playReducer(s, { type: 'hint' })
  s = playReducer(s, { type: 'tap', result: { correct: false, zone: wrongFor(t, FACE_IDS) } })
  s = playReducer(s, { type: 'tap', result: { correct: true, zone: zoneFor(t) } })
  s = playReducer(s, { type: 'next' })
  assert.equal(s.index, 1)
  assert.equal(s.misses, 0)
  assert.equal(s.hint, false)
  assert.equal(s.wrong, false)
  assert.notEqual(currentWordId(s), t)
})

check('taps are ignored while showing Correct, and Next word is ignored while asking', () => {
  let s = startPlay(FACE_IDS, seeded(4))
  const before = s
  assert.equal(playReducer(s, { type: 'next' }), before)
  const t = currentWordId(s)
  s = playReducer(s, { type: 'tap', result: { correct: true, zone: zoneFor(t) } })
  assert.equal(playReducer(s, { type: 'tap', result: { correct: false, zone: wrongFor(t, FACE_IDS) } }), s)
})

for (const [name, ids, n] of [['Face', FACE_IDS, 13], ['Body', BODY_IDS, 9]]) {
  check(`${name} level completes after all ${n} words are found`, () => {
    assert.equal(ids.length, n)
    let s = startPlay(ids, seeded(5))
    for (let i = 0; i < ids.length; i++) {
      assert.notEqual(s.status, 'complete')
      const t = currentWordId(s)
      s = playReducer(s, { type: 'tap', result: { correct: true, zone: zoneFor(t) } })
      if (i < ids.length - 1) {
        assert.equal(s.status, 'correct')
        s = playReducer(s, { type: 'next' })
      }
    }
    assert.equal(s.status, 'complete')
    assert.equal(Object.keys(s.found).length, ids.length)
    assert.equal(currentWordId(s), null)
    assert.equal(playReducer(s, { type: 'hint' }), s)
  })
}

console.log('Labels')

check('label columns: outer sides, and the gutter between the two body figures', () => {
  const body = ANATOMY_LEVELS.body.images
  assert.equal(labelColumn(byId('hand-f-l'), body), 'outer-left')
  assert.equal(labelColumn(byId('hand-f-r'), body), 'between-0')
  assert.equal(labelColumn(byId('back'), body), 'outer-right')
  assert.equal(labelColumn(byId('ear-l'), ['face']), 'outer-left')
})

check('labels in one column are spread at least the gap apart and stay in range', () => {
  const ys = layoutLabels([
    { key: 'a', column: 'c', y: 50 },
    { key: 'b', column: 'c', y: 51 },
    { key: 'c', column: 'c', y: 52 },
    { key: 'd', column: 'other', y: 51 },
    { key: 'e', column: 'c', y: 99 },
  ], 4, 6, 86)
  assert.ok(ys.b - ys.a >= 4 - 1e-9 && ys.c - ys.b >= 4 - 1e-9)
  assert.equal(ys.d, 51)
  assert.equal(ys.e, 86)
  assert.ok(ys.a >= 6)
})

// Show all names, with the spacing AnatomyGame.jsx uses: 24px steps at
// 700px and below, 28px above, within these ranges (percent of height).
const LABEL_RANGE = { face: [4, 96], body: [6, 86] }
for (const [lvl, sizes] of [['face', SIZES.face], ['body', SIZES.body]]) {
  for (const [i, [, H]] of sizes.entries()) {
    const step = i === 0 ? 24 : 28
    check(`Show all names, ${lvl} level ${H}px tall: one label per word, none overlapping, all in range`, () => {
      const images = ANATOMY_LEVELS[lvl].images
      const zones = ANATOMY_ZONES.filter((z) => images.includes(z.image))
      const picked = showAllZones(zones, images)
      assert.equal(picked.length, new Set(zones.map((z) => z.wordId)).size)
      assert.equal(new Set(picked.map((z) => z.wordId)).size, picked.length)
      const gap = (step / H) * 100
      const [minY, maxY] = LABEL_RANGE[lvl]
      const items = picked.map((z) => ({ key: z.id, column: labelColumn(z, images), y: z.shape.cy }))
      const ys = layoutLabels(items, gap, minY, maxY)
      const cols = {}
      for (const it of items) (cols[it.column] ??= []).push(ys[it.key])
      for (const list of Object.values(cols)) {
        list.sort((a, b) => a - b)
        list.forEach((y, k) => {
          assert.ok(y >= minY - 1e-9 && y <= maxY + 1e-9, `in range: ${y}`)
          if (k > 0) assert.ok(y - list[k - 1] >= gap - 1e-9, `gap ${y - list[k - 1]} < ${gap}`)
        })
      }
    })
  }
}

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`)
