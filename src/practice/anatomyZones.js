// Anatomy Match tap zones. Words and English meanings come from
// anatomyGameSpots.js (by word id). This file says where each part is drawn,
// and so which level it belongs to: a word is in the level whose images hold
// its zones (ANATOMY_WORD_LEVEL below), not the `view` in anatomyGameSpots.js.
//
// Shapes are percentages of their own image:
//   ellipse: cx, cy (center), w, h (full width and height)
//   polygon: points [[x, y], ...]  (supported, not used yet)
// `side` is where the word's label sits when this zone is the one tapped.
// Paired parts have a zone on each side; either one counts.
// Calibrate by eye with ?zones=1 in the address.

export const ANATOMY_IMAGES = {
  face:  { src: '/anatomy-face.png',         aspect: 1,     alt: 'CHamoru child face closeup' },
  front: { src: '/anatomy-figure-front.png', aspect: 1 / 3, alt: 'CHamoru child figure, front view' },
  back:  { src: '/anatomy-figure-back.png',  aspect: 1 / 3, alt: 'CHamoru child figure, back view' },
}

export const ANATOMY_LEVELS = {
  face: { images: ['face'] },
  body: { images: ['front', 'back'] },
}

const e = (cx, cy, w, h) => ({ type: 'ellipse', cx, cy, w, h })

export const ANATOMY_ZONES = [
  // ── Face image ─────────────────────────────────────────────────────
  { id: 'forehead',    wordId: 529, image: 'face', side: 'right', shape: e(49.4, 35,   30,  12)  },
  { id: 'eyebrow-l',   wordId: 538, image: 'face', side: 'left',  shape: e(36,   44.5, 16,  5.5) },
  { id: 'eyebrow-r',   wordId: 538, image: 'face', side: 'right', shape: e(62.5, 44.5, 16,  5.5) },
  { id: 'eyelashes-l', wordId: 549, image: 'face', side: 'left',  shape: e(36.5, 50.5, 15,  4)   },
  { id: 'eyelashes-r', wordId: 549, image: 'face', side: 'right', shape: e(62,   50.5, 15,  4)   },
  { id: 'eye-l',       wordId: 532, image: 'face', side: 'left',  shape: e(36.7, 54.5, 14,  10)  },
  { id: 'eye-r',       wordId: 532, image: 'face', side: 'right', shape: e(61.5, 54.5, 14,  10)  },
  { id: 'eyeball-l',   wordId: 531, image: 'face', side: 'left',  shape: e(37,   54.5, 7,   7)   },
  { id: 'eyeball-r',   wordId: 531, image: 'face', side: 'right', shape: e(61.5, 54.5, 7,   7)   },
  { id: 'ear-l',       wordId: 544, image: 'face', side: 'left',  shape: e(21,   60.5, 8.5, 15)  },
  { id: 'ear-r',       wordId: 544, image: 'face', side: 'right', shape: e(77,   60.5, 8.5, 15)  },
  { id: 'nose',        wordId: 539, image: 'face', side: 'right', shape: e(49.4, 63,   12,  10)  },
  { id: 'mouth',       wordId: 540, image: 'face', side: 'left',  shape: e(49.4, 73,   17,  7)   },
  { id: 'chin',        wordId: 530, image: 'face', side: 'right', shape: e(49.4, 80.5, 15,  6)   },
  // Larger areas. Smaller features inside them win under the smallest zone
  // rule; Head is reached through "Also here" in Explore.
  { id: 'neck',        wordId: 545, image: 'face', side: 'right', shape: e(50.5, 91,   24,  12)  },
  { id: 'face',        wordId: 537, image: 'face', side: 'left',  shape: e(49.5, 58,   46,  58)  },
  { id: 'head',        wordId: 528, image: 'face', side: 'left',  shape: e(48.5, 44,   80,  82)  },
  // Hair: five ellipses that follow the hair mass, off the forehead and ears
  // as far as an ellipse allows.
  { id: 'hair-top',    wordId: 548, image: 'face', side: 'right', shape: e(49,   17,   66,  24)  },
  { id: 'hair-l',      wordId: 548, image: 'face', side: 'left',  shape: e(22,   40,   20,  30)  },
  { id: 'hair-l-low',  wordId: 548, image: 'face', side: 'left',  shape: e(25,   73,   18,  18)  },
  { id: 'hair-r',      wordId: 548, image: 'face', side: 'right', shape: e(78,   38,   20,  28)  },
  { id: 'hair-r-low',  wordId: 548, image: 'face', side: 'right', shape: e(78,   66,   16,  26)  },

  // ── Front figure ───────────────────────────────────────────────────
  { id: 'chest-f',     wordId: 541, image: 'front', side: 'left',  shape: e(50,   32.5, 34, 9)  },
  { id: 'stomach-f',   wordId: 542, image: 'front', side: 'right', shape: e(50,   43,   36, 8)  },
  { id: 'hand-f-l',    wordId: 534, image: 'front', side: 'left',  shape: e(10.5, 49.5, 17, 8)  },
  { id: 'hand-f-r',    wordId: 534, image: 'front', side: 'right', shape: e(89.5, 49.5, 17, 8)  },
  { id: 'fingers-f-l', wordId: 533, image: 'front', side: 'left',  shape: e(10.5, 52,   16, 4)  },
  { id: 'fingers-f-r', wordId: 533, image: 'front', side: 'right', shape: e(89,   52,   16, 4)  },
  { id: 'thigh-l',     wordId: 547, image: 'front', side: 'left',  shape: e(35.5, 57,   22, 7)  },
  { id: 'thigh-r',     wordId: 547, image: 'front', side: 'right', shape: e(64.5, 57,   22, 7)  },
  { id: 'knee-l',      wordId: 543, image: 'front', side: 'left',  shape: e(34,   64.5, 15, 5)  },
  { id: 'knee-r',      wordId: 543, image: 'front', side: 'right', shape: e(66,   64.5, 15, 5)  },
  { id: 'feet-f-l',    wordId: 535, image: 'front', side: 'left',  shape: e(24,   84,   18, 6)  },
  { id: 'feet-f-r',    wordId: 535, image: 'front', side: 'right', shape: e(75,   84,   18, 6)  },

  // ── Back figure ────────────────────────────────────────────────────
  { id: 'back',        wordId: 536, image: 'back', side: 'right', shape: e(50,   33,   40, 13) },
  { id: 'buttocks',    wordId: 546, image: 'back', side: 'right', shape: e(50,   53,   48, 8)  },
]

// The level each word is in, from the images its zones are on.
export const ANATOMY_WORD_LEVEL = Object.fromEntries(
  ANATOMY_ZONES.map((z) => [
    z.wordId,
    Object.keys(ANATOMY_LEVELS).find((lvl) => ANATOMY_LEVELS[lvl].images.includes(z.image)),
  ])
)
