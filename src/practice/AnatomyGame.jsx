import { useEffect, useReducer, useRef, useState } from 'react'
import { Check, Star } from 'lucide-react'
import { ANATOMY_SPOTS } from './anatomyGameSpots.js'
import { ANATOMY_LEVELS, ANATOMY_WORD_LEVEL, ANATOMY_ZONES } from './anatomyZones.js'
import {
  currentWordId,
  exploreFromZone,
  labelColumn,
  layoutLabels,
  pickAlsoHere,
  playFromZone,
  playReducer,
  resolveExploreTap,
  resolvePlayTap,
  showAllZones,
  startPlay,
} from './anatomyLogic.js'
import AnatomyFigure from './AnatomyFigure.jsx'
import './anatomy.css'

const WRONG_FLASH_MS = 500
// How long a found word's zones stay filled green before they clear.
const FOUND_FLASH_MS = 1500
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Label height plus spacing, in px, used to keep labels from overlapping
// (labels are smaller at 700px and below).
const labelStepPx = () => (window.matchMedia('(max-width: 700px)').matches ? 24 : 28)
// Where labels may sit, in percent of the image height. The body figures
// are cropped to 4% to 88% of their height in anatomy.css.
const LABEL_RANGE = { face: [4, 96], body: [6, 86] }

const WORDS = Object.fromEntries(ANATOMY_SPOTS.map((s) => [s.id, s]))
// Levels come from the zones data (ANATOMY_WORD_LEVEL), in word list order.
const LEVEL_WORD_IDS = {
  face: ANATOMY_SPOTS.filter((s) => ANATOMY_WORD_LEVEL[s.id] === 'face').map((s) => s.id),
  body: ANATOMY_SPOTS.filter((s) => ANATOMY_WORD_LEVEL[s.id] === 'body').map((s) => s.id),
}
const LEVEL_ZONES = Object.fromEntries(
  Object.entries(ANATOMY_LEVELS).map(([key, lvl]) => [
    key,
    ANATOMY_ZONES.filter((z) => lvl.images.includes(z.image)),
  ])
)
const ZONES_BY_ID = Object.fromEntries(ANATOMY_ZONES.map((z) => [z.id, z]))

const SHOW_ZONES = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('zones') === '1'

function gameReducer(state, action) {
  if (action.type === 'reset') return action.state
  return playReducer(state, action)
}

function Stars({ total, filled }) {
  return (
    <span className="anatomy-stars" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} size={20} className={i < filled ? 'anatomy-star anatomy-star--on' : 'anatomy-star'} />
      ))}
    </span>
  )
}

function Switch({ options, value, onChange, tone }) {
  return (
    <div className={`anatomy-switch anatomy-switch--${tone}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="anatomy-switch__btn"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AnatomyGame() {
  const [level, setLevel] = useState('face')
  const [mode, setMode] = useState('explore')
  const [explore, setExplore] = useState(null) // { zoneId, under, alsoHere }
  const [showAll, setShowAll] = useState(false)
  const [hoverZoneId, setHoverZoneId] = useState(null)
  const [seen, setSeen] = useState({ face: [], body: [] })
  const [play, dispatch] = useReducer(gameReducer, LEVEL_WORD_IDS.face, startPlay)
  const [wrongZoneId, setWrongZoneId] = useState(null)
  const [flashWordId, setFlashWordId] = useState(null) // word just found
  const [boardH, setBoardH] = useState(0)

  const panelRef = useRef(null)
  const findRef = useRef(null)
  const nextRef = useRef(null)
  const nextLevelRef = useRef(null)
  const focusArmed = useRef(false)

  const images = ANATOMY_LEVELS[level].images
  const zones = LEVEL_ZONES[level]
  const wordIds = LEVEL_WORD_IDS[level]
  const total = wordIds.length
  const foundCount = Object.keys(play.found).length
  const targetId = currentWordId(play)
  const target = targetId != null ? WORDS[targetId] : null
  const otherLevel = level === 'face' ? 'body' : 'face'

  // Clear the wrong flash after a moment.
  useEffect(() => {
    if (!wrongZoneId) return
    const t = setTimeout(() => setWrongZoneId(null), WRONG_FLASH_MS)
    return () => clearTimeout(t)
  }, [wrongZoneId])

  // A found word's zones flash green for FOUND_FLASH_MS (the fade is in
  // anatomy.css), or until Next word. With reduced motion the fill stays
  // until Next word, except on the last word, where nothing follows: then
  // it clears after the same time so the finished figure is clean.
  useEffect(() => {
    if (flashWordId == null) return
    if (prefersReducedMotion() && play.status !== 'complete') return
    const t = setTimeout(() => setFlashWordId(null), FOUND_FLASH_MS)
    return () => clearTimeout(t)
  }, [flashWordId, play.status])

  // Image height in px, to space the labels.
  useEffect(() => {
    const board = panelRef.current?.querySelector('.anatomy-fig__board')
    if (!board) return
    const ro = new ResizeObserver(([entry]) => setBoardH(entry.contentRect.height))
    ro.observe(board)
    return () => ro.disconnect()
  }, [level, mode])

  // Move focus with the round: to Next word after a correct answer, to the
  // next level button when the level is done, back to the word card after
  // Next word. Enter on the focused button advances.
  useEffect(() => {
    if (!focusArmed.current) return
    focusArmed.current = false
    if (play.status === 'correct') nextRef.current?.focus()
    else if (play.status === 'complete') nextLevelRef.current?.focus()
    else findRef.current?.focus()
  }, [play.status, play.index])

  function resetPlay(lvl) {
    dispatch({ type: 'reset', state: startPlay(LEVEL_WORD_IDS[lvl]) })
    setWrongZoneId(null)
    setFlashWordId(null)
  }

  function changeLevel(lvl) {
    if (lvl === level) return
    setLevel(lvl)
    setExplore(null)
    setHoverZoneId(null)
    resetPlay(lvl)
  }

  function changeMode(m) {
    setMode(m)
    setWrongZoneId(null)
    setFlashWordId(null)
    setHoverZoneId(null)
  }

  function selectExplore(res) {
    setExplore({ zoneId: res.zone.id, under: res.under, alsoHere: res.alsoHere })
    setSeen((prev) => (
      prev[level].includes(res.zone.wordId)
        ? prev
        : { ...prev, [level]: [...prev[level], res.zone.wordId] }
    ))
  }

  // A word picked from "Also here" becomes the selection at the same spot.
  function pickAlso(wordId) {
    const res = pickAlsoHere(zones, explore, wordId)
    if (res) selectExplore(res)
  }

  // Tint the zone under the pointer: on mouse hover, and while a finger or
  // pen is down. The zone is the one an Explore tap there would pick.
  function handlePointer(event, board, image) {
    const { type, pointerType } = event
    if (type === 'pointerleave' || type === 'pointercancel' ||
        (type === 'pointerup' && pointerType !== 'mouse')) {
      setHoverZoneId(null)
      return
    }
    if (!board || (type === 'pointermove' && pointerType !== 'mouse' && event.buttons === 0)) return
    if (type === 'pointerup') return
    const rect = board.getBoundingClientRect()
    const res = resolveExploreTap(
      zones.filter((z) => z.image === image),
      event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height
    )
    setHoverZoneId(res ? res.zone.id : null)
  }

  function handleActivate(zone, event, board) {
    if (!board) return
    const rect = board.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const keyboard = event.detail === 0
    const imageZones = zones.filter((z) => z.image === zone.image)

    if (mode === 'explore') {
      const res = keyboard
        ? exploreFromZone(imageZones, zone, W, H)
        : resolveExploreTap(imageZones, x, y, W, H)
      if (res) selectExplore(res)
      return
    }

    if (play.status !== 'asking') return
    const result = keyboard
      ? playFromZone(zone, targetId)
      : resolvePlayTap(imageZones, x, y, W, H, targetId)
    if (!result) return
    if (result.correct) {
      focusArmed.current = true
      setFlashWordId(targetId)
    } else {
      setWrongZoneId(result.zone.id)
    }
    dispatch({ type: 'tap', result })
  }

  function nextWord() {
    focusArmed.current = true
    setFlashWordId(null)
    dispatch({ type: 'next' })
  }

  function goNextLevel() {
    changeLevel(otherLevel)
    setMode('play')
  }

  // ── Zone drawing state and labels ──────────────────────────────────
  const selectedZoneId = mode === 'explore' ? explore?.zoneId : null
  const hintWordId = mode === 'play' && play.status === 'asking' && play.hint ? targetId : null

  function zoneState(zone) {
    const out = []
    if (zone.id === hoverZoneId) out.push('hover')
    if (mode === 'explore') {
      if (zone.id === selectedZoneId) out.push('selected')
    } else {
      if (zone.wordId === flashWordId) out.push('flash')
      if (zone.wordId === hintWordId) out.push('hint')
    }
    if (zone.id === wrongZoneId) out.push('wrong')
    return out
  }

  // Play labels never name the part; Explore labels may.
  const zoneIndex = Object.fromEntries(zones.map((z, i) => [z.id, i + 1]))
  function zoneLabel(zone) {
    return mode === 'explore' ? WORDS[zone.wordId].english : `Part ${zoneIndex[zone.id]}`
  }

  let labelItems
  if (mode === 'explore') {
    const selected = selectedZoneId ? ZONES_BY_ID[selectedZoneId] : null
    const all = showAll ? showAllZones(zones, images) : []
    labelItems = all
      .filter((z) => z.wordId !== selected?.wordId)
      .map((zone) => ({ zone, withSub: false, dot: false }))
    if (selected) labelItems.push({ zone: selected, withSub: true, dot: false })
  } else {
    // Found parts keep only a label, its line and a small dot on the part.
    labelItems = Object.values(play.found).map((id) => ({ zone: ZONES_BY_ID[id], withSub: false, dot: true }))
  }
  const gap = boardH > 0 ? (labelStepPx() / boardH) * 100 : 6
  const [minY, maxY] = LABEL_RANGE[level]
  const labelY = layoutLabels(
    labelItems.map(({ zone }) => ({ key: zone.id, column: labelColumn(zone, images), y: zone.shape.cy })),
    gap, minY, maxY
  )
  function labelsFor(image) {
    return labelItems
      .filter(({ zone }) => zone.image === image)
      .map(({ zone, withSub, dot }) => ({
        zone,
        dot,
        y: labelY[zone.id],
        text: WORDS[zone.wordId].chamorro,
        sub: withSub ? WORDS[zone.wordId].english : null,
      }))
  }

  // ── Cards ──────────────────────────────────────────────────────────
  const selectedWord = selectedZoneId ? WORDS[ZONES_BY_ID[selectedZoneId].wordId] : null
  const hintText = play.misses > 0
    ? 'Not quite. Look at the glowing part.'
    : 'Look at the glowing part.'
  const showHintButton = mode === 'play' && play.status === 'asking' && !play.hint

  let liveText = ''
  if (mode === 'explore' && selectedWord) {
    liveText = `You tapped ${selectedWord.chamorro}, ${selectedWord.english}`
  } else if (mode === 'play') {
    if (play.status === 'complete') liveText = `All ${total} found!`
    else if (play.status === 'correct') liveText = `Correct! ${WORDS[targetId].chamorro}, ${WORDS[targetId].english}`
    else if (play.wrong) liveText = play.hint ? `Try again. ${hintText}` : 'Try again'
    else if (play.hint) liveText = hintText
  }

  const hintButton = (cls) => (
    <button type="button" className={`anatomy-btn anatomy-btn--outline ${cls}`} onClick={() => dispatch({ type: 'hint' })}>
      Show me a hint
    </button>
  )

  return (
    <div className={`anatomy-game anatomy-game--${mode} anatomy-game--${level}`}>
      <header className="anatomy-game__header">
        <div className="anatomy-game__brand">
          <a className="anatomy-game__home" href="/practice">← Modes</a>
          <h1 className="anatomy-game__title">Anatomy Match</h1>
        </div>
        <div className="anatomy-game__switches">
          <Switch
            tone="level"
            value={level}
            onChange={changeLevel}
            options={[{ value: 'face', label: 'Face' }, { value: 'body', label: 'Body' }]}
          />
          <div className="anatomy-game__mode-top">
            <Switch
              tone="mode"
              value={mode}
              onChange={changeMode}
              options={[{ value: 'explore', label: 'Explore' }, { value: 'play', label: 'Play' }]}
            />
          </div>
        </div>
      </header>

      <p className="anatomy-sr-only" aria-live="polite">{liveText}</p>

      <main className="anatomy-game__main">
        <section className="anatomy-game__panel" ref={panelRef}>
          {mode === 'play' && play.status === 'correct' && (
            <span className="anatomy-pill" aria-hidden="true">
              <Check size={16} /> Correct!
            </span>
          )}
          <div
            key={`${level}-${mode}`}
            className={`anatomy-figs${mode === 'explore' ? ' anatomy-figs--intro' : ''}`}
          >
            {images.map((image) => (
              <AnatomyFigure
                key={image}
                image={image}
                zones={zones.filter((z) => z.image === image)}
                caption={level === 'body' ? (image === 'front' ? 'FRONT' : 'BACK') : null}
                labels={labelsFor(image)}
                zoneState={zoneState}
                zoneLabel={zoneLabel}
                debugName={SHOW_ZONES ? (z) => WORDS[z.wordId].english : null}
                onActivate={handleActivate}
                onPointer={handlePointer}
              />
            ))}
          </div>
        </section>

        <aside className="anatomy-side">
          {mode === 'explore' ? (
            <>
              <div className="anatomy-card anatomy-card--primary">
                <p className="anatomy-card__eyebrow">Explore</p>
                <p className="anatomy-card__text">Tap any part to see its CHamoru name.</p>
                <button
                  type="button"
                  className="anatomy-btn anatomy-btn--outline"
                  aria-pressed={showAll}
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? 'Hide names' : 'Show all names'}
                </button>
              </div>

              {selectedWord && (
                <div className="anatomy-card anatomy-card--primary anatomy-card--tapped">
                  <p className="anatomy-card__eyebrow">You tapped</p>
                  <p className="anatomy-card__word" lang="ch">{selectedWord.chamorro}</p>
                  <p className="anatomy-card__meaning">{selectedWord.english}</p>
                  {explore.alsoHere.length > 0 && (
                    <div className="anatomy-also">
                      <p className="anatomy-card__eyebrow">Also here</p>
                      <ul className="anatomy-also__list">
                        {explore.alsoHere.map((id) => (
                          <li key={id}>
                            <button type="button" className="anatomy-also__btn" onClick={() => pickAlso(id)}>
                              <span className="anatomy-also__word" lang="ch">{WORDS[id].chamorro}</span>
                              <span className="anatomy-also__meaning">{WORDS[id].english}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="anatomy-card anatomy-card--secondary">
                <p className="anatomy-card__count">{seen[level].length} of {total} parts seen</p>
                <button type="button" className="anatomy-btn anatomy-btn--primary" onClick={() => changeMode('play')}>
                  Start playing
                </button>
              </div>
            </>
          ) : play.status === 'complete' ? (
            <div className="anatomy-card anatomy-card--primary">
              <p className="anatomy-card__eyebrow">Level complete</p>
              <p className="anatomy-card__title">All {total} found!</p>
              <Stars total={total} filled={total} />
              <div className="anatomy-card__actions">
                <button
                  type="button"
                  ref={nextLevelRef}
                  className="anatomy-btn anatomy-btn--primary"
                  onClick={goNextLevel}
                >
                  {otherLevel === 'body' ? 'Next level: Body' : 'Next level: Face'}
                </button>
                <button type="button" className="anatomy-btn anatomy-btn--outline" onClick={() => resetPlay(level)}>
                  Play again
                </button>
              </div>
            </div>
          ) : (
            <>
              {play.status === 'correct' ? (
                <div className="anatomy-card anatomy-card--primary anatomy-card--correct">
                  <p className="anatomy-card__eyebrow anatomy-card__eyebrow--correct">Correct!</p>
                  <p className="anatomy-card__word" lang="ch">{target.chamorro}</p>
                  <p className="anatomy-card__meaning anatomy-card__meaning--found">{target.english}</p>
                  <button
                    type="button"
                    ref={nextRef}
                    className="anatomy-btn anatomy-btn--primary"
                    onClick={nextWord}
                  >
                    Next word
                  </button>
                </div>
              ) : (
                <div className="anatomy-card anatomy-card--primary" ref={findRef} tabIndex={-1}>
                  <p className="anatomy-card__eyebrow">Find this part</p>
                  <p className="anatomy-card__word" lang="ch">{target.chamorro}</p>
                  <p className="anatomy-card__text">{level === 'face' ? 'Tap it on the face.' : 'Tap it on the body.'}</p>
                </div>
              )}

              {play.status === 'asking' && (play.wrong || play.hint) && (
                <div className={`anatomy-card anatomy-card--primary${play.wrong ? ' anatomy-card--wrong' : ''}`}>
                  {play.wrong && <p className="anatomy-card__eyebrow anatomy-card__eyebrow--wrong">Try again</p>}
                  {play.hint && <p className="anatomy-card__text">{hintText}</p>}
                </div>
              )}

              <div className="anatomy-card anatomy-card--secondary">
                <Stars total={total} filled={foundCount} />
                <p className="anatomy-card__count">{foundCount} of {total} found</p>
              </div>

              {showHintButton && hintButton('anatomy-side__hint')}
            </>
          )}
        </aside>
      </main>

      <div className="anatomy-game__bottom">
        {showHintButton && hintButton('anatomy-game__bottom-hint')}
        <Switch
          tone="mode"
          value={mode}
          onChange={changeMode}
          options={[{ value: 'explore', label: 'Explore' }, { value: 'play', label: 'Play' }]}
        />
      </div>
    </div>
  )
}

export default AnatomyGame
