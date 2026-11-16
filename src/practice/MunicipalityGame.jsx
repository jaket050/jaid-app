import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Check, Star } from 'lucide-react'
import {
  INSET,
  LEVELS_WITH_INSET,
  LEVEL_FRAMES,
  LEVEL_NAMES,
  LEVEL_ORDER,
  LEVEL_REGION_IDS,
  REGIONS_BY_ID,
} from './municipalityMapData.js'
import {
  ALL_LEVEL_FONTS,
  currentWordId,
  playFromRegion,
  playReducer,
  resolveExploreTap,
  resolvePlayTap,
  labelsInView,
  numberOrder,
  showAllLayout,
  singleLabel,
  startPlay,
  viewContext,
  zoomLinePairs,
} from './municipalityLogic.js'
import MunicipalityBoard from './MunicipalityBoard.jsx'
import './municipality.css'

const WRONG_FLASH_MS = 500
// How long a found place stays filled green before it clears.
const FOUND_FLASH_MS = 1500
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Label font size in px (smaller at 700px and below), used for placement.
// Matches .muni-label in municipality.css.
const labelFontPx = () => (
  typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches ? 15 : 18
)

const EMPTY_SEEN = Object.fromEntries(LEVEL_ORDER.map((l) => [l, []]))

function gameReducer(state, action) {
  if (action.type === 'reset') return action.state
  return playReducer(state, action)
}

// More than 13 stars (the All level) are drawn smaller so they fit on one
// line of the side column.
function Stars({ total, filled }) {
  const many = total > 13
  return (
    <span className={`muni-stars${many ? ' muni-stars--many' : ''}`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} size={many ? 14 : 20} className={i < filled ? 'muni-star muni-star--on' : 'muni-star'} />
      ))}
    </span>
  )
}

function Switch({ options, value, onChange, tone }) {
  return (
    <div className={`muni-switch muni-switch--${tone}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="muni-switch__btn"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ZoomLines({ frame, viewsRef, mainRef, insetRef }) {
  const [pairs, setPairs] = useState([])

  useEffect(() => {
    const views = viewsRef.current
    const main = mainRef.current
    const inset = insetRef.current
    if (!views || !main || !inset) return
    const measure = () => {
      const c = views.getBoundingClientRect()
      const m = main.getBoundingClientRect()
      const z = inset.getBoundingClientRect()
      const outline = {
        x: m.left - c.left + ((INSET.x - frame.x) / frame.w) * m.width,
        y: m.top - c.top + ((INSET.y - frame.y) / frame.h) * m.height,
        w: (INSET.w / frame.w) * m.width,
        h: (INSET.h / frame.h) * m.height,
      }
      const zoom = { x: z.left - c.left, y: z.top - c.top, w: z.width, h: z.height }
      setPairs(zoomLinePairs(outline, zoom))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(views)
    ro.observe(main)
    ro.observe(inset)
    return () => ro.disconnect()
  }, [frame, viewsRef, mainRef, insetRef])

  return (
    <svg className="muni-zoom-lines" aria-hidden="true">
      {pairs.map(([[x1, y1], [x2, y2]], i) => (
        <g key={i}>
          <line className="muni-zoom-lines__halo" x1={x1} y1={y1} x2={x2} y2={y2} />
          <line className="muni-zoom-lines__line" x1={x1} y1={y1} x2={x2} y2={y2} />
        </g>
      ))}
    </svg>
  )
}

// The "Names" key for numbered places: one column in number order, at
// 18px, or 15px when there are more than 8 names.
function NamesKey({ ids }) {
  return (
    <div className="muni-card muni-card--key">
      <p className="muni-card__eyebrow">Names</p>
      <ol className={`muni-key${ids.length > 8 ? ' muni-key--small' : ''}`}>
        {ids.map((id, i) => (
          <li key={id} className="muni-key__item">
            <span className="muni-key__n" aria-hidden="true">{i + 1}</span>
            <span className="muni-key__name" lang="ch">{REGIONS_BY_ID.get(id).name}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const LEVEL_OPTIONS = LEVEL_ORDER.map((l) => ({ value: l, label: LEVEL_NAMES[l] }))
const MODE_OPTIONS = [{ value: 'explore', label: 'Explore' }, { value: 'play', label: 'Play' }]

function MunicipalityGame() {
  const [level, setLevel] = useState('north')
  const [mode, setMode] = useState('explore')
  const [selectedId, setSelectedId] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [hoverId, setHoverId] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const [seen, setSeen] = useState(EMPTY_SEEN)
  const [play, dispatch] = useReducer(gameReducer, LEVEL_REGION_IDS.north, startPlay)
  const [wrongId, setWrongId] = useState(null)
  const [flashId, setFlashId] = useState(null)
  const [scales, setScales] = useState({ main: 0, inset: 0 })

  const viewsRef = useRef(null)
  const mainBoxRef = useRef(null)
  const insetBoxRef = useRef(null)
  const findRef = useRef(null)
  const nextRef = useRef(null)
  const nextLevelRef = useRef(null)
  const focusArmed = useRef(false)

  const levelIds = LEVEL_REGION_IDS[level]
  const levelSet = useMemo(() => new Set(levelIds), [levelIds])
  const levelRegions = useMemo(() => levelIds.map((id) => REGIONS_BY_ID.get(id)), [levelIds])
  const hasInset = LEVELS_WITH_INSET.includes(level)
  const total = levelIds.length
  const foundCount = Object.keys(play.found).length
  const targetId = currentWordId(play)
  const target = targetId != null ? REGIONS_BY_ID.get(targetId) : null
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1] ?? null

  useEffect(() => {
    if (!wrongId) return
    const t = setTimeout(() => setWrongId(null), WRONG_FLASH_MS)
    return () => clearTimeout(t)
  }, [wrongId])

  // A found place flashes green for FOUND_FLASH_MS (the fade is in
  // municipality.css), or until Next place. With reduced motion the fill
  // stays until Next place, except on the last place, where nothing
  // follows: then it clears after the same time.
  useEffect(() => {
    if (flashId == null) return
    if (prefersReducedMotion() && play.status !== 'complete') return
    const t = setTimeout(() => setFlashId(null), FOUND_FLASH_MS)
    return () => clearTimeout(t)
  }, [flashId, play.status])

  // Move focus with the round, as in Anatomy Match.
  useEffect(() => {
    if (!focusArmed.current) return
    focusArmed.current = false
    if (play.status === 'correct') nextRef.current?.focus()
    else if (play.status === 'complete') nextLevelRef.current?.focus()
    else findRef.current?.focus()
  }, [play.status, play.index])

  const handleScale = useCallback((kind, s) => {
    setScales((prev) => (prev[kind] === s ? prev : { ...prev, [kind]: s }))
  }, [])

  function resetPlay(lvl) {
    dispatch({ type: 'reset', state: startPlay(LEVEL_REGION_IDS[lvl]) })
    setWrongId(null)
    setFlashId(null)
  }

  function changeLevel(lvl) {
    if (lvl === level) return
    setLevel(lvl)
    setSelectedId(null)
    setHoverId(null)
    resetPlay(lvl)
  }

  function changeMode(m) {
    setMode(m)
    setWrongId(null)
    setFlashId(null)
    setHoverId(null)
  }

  function selectExplore(region) {
    setSelectedId(region.id)
    setSeen((prev) => (
      prev[level].includes(region.id) ? prev : { ...prev, [level]: [...prev[level], region.id] }
    ))
  }

  function answer(result) {
    if (!result) return
    if (result.correct) {
      focusArmed.current = true
      setFlashId(targetId)
    } else {
      setWrongId(result.zone.id)
    }
    dispatch({ type: 'tap', result })
  }

  function handleTap({ x, y, scale }) {
    if (mode === 'explore') {
      const region = resolveExploreTap(levelRegions, x, y, scale)
      if (region) selectExplore(region)
      return
    }
    if (play.status !== 'asking') return
    answer(resolvePlayTap(levelRegions, x, y, scale, targetId))
  }

  function handleKeyActivate(region) {
    if (mode === 'explore') {
      selectExplore(region)
      return
    }
    if (play.status !== 'asking') return
    answer(playFromRegion(region, targetId))
  }

  // Light the region under the pointer: on mouse hover, and while a finger
  // or pen is down. Same rule as an Explore tap.
  function handlePointer(event, point) {
    const { type, pointerType } = event
    if (type === 'pointerleave' || type === 'pointercancel' ||
        (type === 'pointerup' && pointerType !== 'mouse')) {
      setHoverId(null)
      return
    }
    if (!point || type === 'pointerup') return
    if (type === 'pointermove' && pointerType !== 'mouse' && event.buttons === 0) return
    const region = resolveExploreTap(levelRegions, point.x, point.y, point.scale)
    setHoverId(region ? region.id : null)
  }

  function handleFocusRegion(id, visible) {
    setFocusId(visible ? id : null)
  }

  function nextPlace() {
    focusArmed.current = true
    setFlashId(null)
    dispatch({ type: 'next' })
  }

  function goNextLevel() {
    changeLevel(nextLevel)
    setMode('play')
  }

  // ── Region states, labels and dots ─────────────────────────────────
  const hintId = mode === 'play' && play.status === 'asking' && play.hint ? targetId : null
  const states = {}
  const add = (id, s) => { if (id) (states[id] ??= []).push(s) }
  add(hoverId, 'hover')
  if (mode === 'explore') add(selectedId, 'selected')
  else {
    add(hintId, 'hint')
    add(flashId, 'flash')
  }
  add(wrongId, 'wrong')
  add(focusId, 'focus')

  // What the map shows. One name at a time: the place just found (Play,
  // until Next place) or the place selected (Explore). "Show all names" and
  // the Level complete screen name every place, inside it or by number.
  const allNames = mode === 'explore' ? showAll : play.status === 'complete'
  let singleId = null
  if (!allNames) {
    if (mode === 'explore') singleId = selectedId
    else if (play.status === 'correct') singleId = targetId
  }
  const foundIds = mode === 'play' ? Object.keys(play.found) : []
  const foundSet = new Set(foundIds)
  // Found places keep a check mark until the level is complete; the place
  // whose name is showing hides its mark under the label.
  const checkIds = mode === 'play' && play.status !== 'complete'
    ? foundIds.filter((id) => id !== singleId)
    : []
  const fontPx = labelFontPx()

  const shown = useMemo(() => {
    const out = { main: { labels: [], numbers: [] }, inset: { labels: [], numbers: [] }, key: [] }
    const kinds = hasInset ? ['main', 'inset'] : ['main']
    const get = (id) => REGIONS_BY_ID.get(id)
    if (allNames) {
      const layouts = {}
      for (const kind of kinds) {
        if (!scales[kind]) continue
        const ctx = viewContext(level, kind, scales[kind])
        // Only the All level steps names down in size before numbering them.
        const fonts = level === 'all'
          ? ALL_LEVEL_FONTS[fontPx === 18 ? 'desktop' : 'phone']
          : [fontPx]
        layouts[kind] = showAllLayout(labelsInView(level, kind, levelIds).map(get), ctx, fonts)
      }
      out.key = numberOrder(Object.values(layouts).flatMap((l) => l.numbered.map((d) => d.id)))
      const n = Object.fromEntries(out.key.map((id, i) => [id, i + 1]))
      for (const kind of Object.keys(layouts)) {
        out[kind].labels = layouts[kind].named
        out[kind].numbers = layouts[kind].numbered.map((d) => ({ ...d, n: n[d.id] }))
      }
    } else if (singleId) {
      for (const kind of kinds) {
        if (!scales[kind] || labelsInView(level, kind, [singleId]).length === 0) continue
        const ctx = viewContext(level, kind, scales[kind])
        out[kind].labels = [{ id: singleId, ...singleLabel(get(singleId), ctx, fontPx) }]
      }
    }
    return out
  }, [allNames, singleId, level, levelIds, hasInset, scales, fontPx])

  const keyCard = shown.key.length > 0 && <NamesKey ids={shown.key} />

  // Play labels never name the place; Explore labels may.
  const placeNumber = Object.fromEntries(levelIds.map((id, i) => [id, i + 1]))
  const regionLabel = (r) => (mode === 'explore' ? r.name : `Place ${placeNumber[r.id]}`)

  // ── Cards ──────────────────────────────────────────────────────────
  const selected = selectedId ? REGIONS_BY_ID.get(selectedId) : null
  const hintText = play.misses > 0
    ? 'Not quite. Look at the glowing part.'
    : 'Look at the glowing part.'
  const showHintButton = mode === 'play' && play.status === 'asking' && !play.hint

  let liveText = ''
  if (mode === 'explore' && selected) {
    liveText = `You tapped ${selected.name}`
  } else if (mode === 'play') {
    if (play.status === 'complete') liveText = `All ${total} found!`
    else if (play.status === 'correct') liveText = `Correct! ${target.name}`
    else if (play.wrong) liveText = play.hint ? `Try again. ${hintText}` : 'Try again'
    else if (play.hint) liveText = hintText
  }

  const hintButton = (cls) => (
    <button type="button" className={`muni-btn muni-btn--outline ${cls}`} onClick={() => dispatch({ type: 'hint' })}>
      Show me a hint
    </button>
  )

  const boardProps = {
    levelIds: levelSet,
    order: levelIds,
    states,
    regionLabel,
    onTap: handleTap,
    onPointer: handlePointer,
    onKeyActivate: handleKeyActivate,
    onFocusRegion: handleFocusRegion,
    onScale: handleScale,
  }

  return (
    <div className={`muni-match muni-match--${mode} muni-match--${level}`}>
      <header className="muni-match__header">
        <div className="muni-match__brand">
          <a className="muni-match__home" href="/practice">← Modes</a>
          <h1 className="muni-match__title">Municipalities</h1>
        </div>
        <div className="muni-match__switches">
          <Switch tone="level" value={level} onChange={changeLevel} options={LEVEL_OPTIONS} />
          <div className="muni-match__mode-top">
            <Switch tone="mode" value={mode} onChange={changeMode} options={MODE_OPTIONS} />
          </div>
        </div>
      </header>

      <p className="muni-sr-only" aria-live="polite">{liveText}</p>

      <main className="muni-match__main">
        <section className="muni-match__panel">
          {mode === 'play' && play.status === 'correct' && (
            <span className="muni-pill" aria-hidden="true">
              <Check size={16} /> Correct!
            </span>
          )}
          <div
            ref={viewsRef}
            className="muni-views"
            style={{
              '--ar-main': LEVEL_FRAMES[level].w / LEVEL_FRAMES[level].h,
              '--ar-inset': INSET.w / INSET.h,
            }}
          >
            <MunicipalityBoard
              key={`main-${level}`}
              kind="main"
              boxRef={mainBoxRef}
              frame={LEVEL_FRAMES[level]}
              scale={scales.main}
              found={foundSet}
              checks={labelsInView(level, 'main', checkIds)}
              labels={shown.main.labels}
              numbers={shown.main.numbers}
              showInsetOutline={hasInset}
              {...boardProps}
            />
            {hasInset && (
              <MunicipalityBoard
                key={`inset-${level}`}
                kind="inset"
                boxRef={insetBoxRef}
                frame={INSET}
                scale={scales.inset}
                found={foundSet}
                checks={labelsInView(level, 'inset', checkIds)}
                labels={shown.inset.labels}
                numbers={shown.inset.numbers}
                showInsetOutline={false}
                caption="Zoomed in"
                {...boardProps}
              />
            )}
            {hasInset && (
              <ZoomLines
                key={`zoom-${level}`}
                frame={LEVEL_FRAMES[level]}
                viewsRef={viewsRef}
                mainRef={mainBoxRef}
                insetRef={insetBoxRef}
              />
            )}
          </div>
        </section>

        <aside className="muni-side">
          {mode === 'explore' ? (
            <>
              {showAll ? (
                // While the names show, a short card makes room for the key:
                // both buttons on one row, the progress as a small line.
                <div className="muni-card muni-card--primary muni-card--compact">
                  <p className="muni-card__eyebrow">Explore</p>
                  <div className="muni-card__row">
                    <button
                      type="button"
                      className="muni-btn muni-btn--outline"
                      aria-pressed="true"
                      onClick={() => setShowAll(false)}
                    >
                      Hide names
                    </button>
                    <button type="button" className="muni-btn muni-btn--primary" onClick={() => changeMode('play')}>
                      Start playing
                    </button>
                  </div>
                  <p className="muni-card__count muni-card__count--small">{seen[level].length} of {total} places seen</p>
                </div>
              ) : (
                <div className="muni-card muni-card--primary">
                  <p className="muni-card__eyebrow">Explore</p>
                  <p className="muni-card__text">Tap any place to see its CHamoru name.</p>
                  <button
                    type="button"
                    className="muni-btn muni-btn--outline"
                    aria-pressed="false"
                    onClick={() => setShowAll(true)}
                  >
                    Show all names
                  </button>
                </div>
              )}

              {selected && !showAll && (
                <div className="muni-card muni-card--primary">
                  <p className="muni-card__eyebrow">You tapped</p>
                  <p className="muni-card__word" lang="ch">{selected.name}</p>
                </div>
              )}

              {keyCard}

              {!showAll && (
                <div className="muni-card muni-card--secondary">
                  <p className="muni-card__count">{seen[level].length} of {total} places seen</p>
                  <button type="button" className="muni-btn muni-btn--primary" onClick={() => changeMode('play')}>
                    Start playing
                  </button>
                </div>
              )}
            </>
          ) : play.status === 'complete' ? (
            <>
              <div className="muni-card muni-card--primary">
                <p className="muni-card__eyebrow">Level complete</p>
                <p className="muni-card__title">All {total} found!</p>
                <Stars total={total} filled={total} />
                <div className="muni-card__actions">
                  {nextLevel && (
                    <button type="button" ref={nextLevelRef} className="muni-btn muni-btn--primary" onClick={goNextLevel}>
                      {`Next level: ${LEVEL_NAMES[nextLevel]}`}
                    </button>
                  )}
                  <button
                    type="button"
                    ref={nextLevel ? undefined : nextLevelRef}
                    className="muni-btn muni-btn--outline"
                    onClick={() => resetPlay(level)}
                  >
                    Play again
                  </button>
                </div>
              </div>
              {keyCard}
            </>
          ) : (
            <>
              {play.status === 'correct' ? (
                <div className="muni-card muni-card--primary muni-card--correct">
                  <p className="muni-card__eyebrow muni-card__eyebrow--correct">Correct!</p>
                  <p className="muni-card__word" lang="ch">{target.name}</p>
                  <button type="button" ref={nextRef} className="muni-btn muni-btn--primary" onClick={nextPlace}>
                    Next place
                  </button>
                </div>
              ) : (
                <div className="muni-card muni-card--primary" ref={findRef} tabIndex={-1}>
                  <p className="muni-card__eyebrow">Find this place</p>
                  <p className="muni-card__word" lang="ch">{target.name}</p>
                  <p className="muni-card__text">Tap it on the map.</p>
                </div>
              )}

              {play.status === 'asking' && (play.wrong || play.hint) && (
                <div className={`muni-card muni-card--primary${play.wrong ? ' muni-card--wrong' : ''}`}>
                  {play.wrong && <p className="muni-card__eyebrow muni-card__eyebrow--wrong">Try again</p>}
                  {play.hint && <p className="muni-card__text">{hintText}</p>}
                </div>
              )}

              <div className="muni-card muni-card--secondary">
                <Stars total={total} filled={foundCount} />
                <p className="muni-card__count">{foundCount} of {total} found</p>
              </div>

              {showHintButton && hintButton('muni-side__hint')}
            </>
          )}
        </aside>
      </main>

      <div className="muni-match__bottom">
        {showHintButton && hintButton('muni-match__bottom-hint')}
        <Switch tone="mode" value={mode} onChange={changeMode} options={MODE_OPTIONS} />
      </div>
    </div>
  )
}

export default MunicipalityGame
