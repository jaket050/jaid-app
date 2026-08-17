// Anatomy Match game — CHamoru body-part names mapped to tap targets across
// three source images:
//   - /anatomy-face.png          (1254×1254 face closeup — view: 'face')
//   - /anatomy-figure-front.png  (512×1536, cropped left half of the
//     original combined figure — view: 'front')
//   - /anatomy-figure-back.png   (512×1536, cropped right half — view: 'back')
// x/y are percentages of the relevant image, so targets stay aligned at any
// render size. Front/back percentages are relative to their own cropped
// image (not the original combined anatomy-figure.png).
// Source: vocabulary table, category = 'Anatomy' (ids 528–549).

export const ANATOMY_SPOTS = [
  // ── Face closeup (anatomy-face.png) — 9 words ──────────────────────────
  { id: 529, chamorro: "hå'i",     english: 'Forehead',   view: 'face', x: 50, y: 32 },
  { id: 538, chamorro: 'sehas',    english: 'Eyebrow',    view: 'face', x: 38, y: 43 },
  { id: 531, chamorro: 'åtaddok',  english: 'Eyeball',    view: 'face', x: 38, y: 53 },
  { id: 532, chamorro: 'måta',     english: 'Eye',        view: 'face', x: 68, y: 58 },
  { id: 549, chamorro: 'bábali',   english: 'Eyelashes',  view: 'face', x: 68, y: 52 },
  { id: 544, chamorro: 'talanga',  english: 'Ear',        view: 'face', x: 24, y: 60 },
  { id: 539, chamorro: "gui'eng",  english: 'Nose',       view: 'face', x: 50, y: 63 },
  { id: 540, chamorro: 'påchot',   english: 'Mouth',      view: 'face', x: 50, y: 71 },
  { id: 530, chamorro: 'åchai',    english: 'Chin',       view: 'face', x: 50, y: 80 },

  // ── Front body (anatomy-figure-front.png) — 11 words ────────────────────
  { id: 528, chamorro: 'ulu',      english: 'Head',      view: 'front', x: 48, y: 4 },
  { id: 548, chamorro: 'gapotulu', english: 'Hair',       view: 'front', x: 28, y: 9 },
  { id: 537, chamorro: 'fåsu',     english: 'Face',       view: 'front', x: 58, y: 20 },
  { id: 545, chamorro: "agå'ga'",  english: 'Neck',       view: 'front', x: 48, y: 25 },
  { id: 541, chamorro: 'pecho',    english: 'Chest',      view: 'front', x: 48, y: 32 },
  { id: 542, chamorro: 'tuyan',    english: 'Stomach',    view: 'front', x: 48, y: 43 },
  { id: 534, chamorro: 'kånnai',   english: 'Hand',       view: 'front', x: 10, y: 47 },
  { id: 533, chamorro: 'kålulot',  english: 'Fingers',    view: 'front', x: 82, y: 52 },
  { id: 547, chamorro: 'petna',    english: 'Thigh',      view: 'front', x: 30, y: 56 },
  { id: 543, chamorro: 'tommo',    english: 'Knee',       view: 'front', x: 30, y: 65 },
  { id: 535, chamorro: 'åddeng',   english: 'Feet',       view: 'front', x: 26, y: 85 },

  // ── Back body (anatomy-figure-back.png) — 2 words ───────────────────────
  { id: 536, chamorro: "tåtalo'",  english: 'Back',       view: 'back',  x: 52, y: 33 },
  { id: 546, chamorro: 'dågan',    english: 'Buttocks',   view: 'back',  x: 44, y: 53 },
]
