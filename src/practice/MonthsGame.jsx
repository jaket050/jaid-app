import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { prefersReducedMotion, usePlacementGame } from './usePlacementGame'
import './match.css'
import './months.css'

// Positions clockwise from 12 o'clock. Each verified "Months of the Year" row
// is matched to its position by its English field.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Where each position sits on the wheel, as percents of the wheel's width
// and height: on a circle of radius 42%, January at the top, clockwise.
// 42% gives the largest square positions that neither touch each other
// (the drop test uses each position's rectangle) nor cross the wheel's
// edge; see months.css.
const WHEEL_SPOTS = MONTHS.map((_, i) => {
  const angle = (i * Math.PI) / 6
  return {
    left: `${(50 + 42 * Math.sin(angle)).toFixed(3)}%`,
    top: `${(50 - 42 * Math.cos(angle)).toFixed(3)}%`,
  }
})

// Season of each month, for the wheel's background tints.
const SEASONS = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
  'summer', 'summer', 'fall', 'fall', 'fall', 'winter',
]

// How long the wheel's celebration pulse lasts (months.css).
const PULSE_MS = 200

// On a correct drop, the wheel grows to 1.02 and back. Only on the wheel
// layout (720px and wider) and only with motion allowed.
function pulseWheel(wheel) {
  if (!wheel || prefersReducedMotion() || !window.matchMedia('(min-width: 720px)').matches) return
  wheel.classList.remove('months-wheel--pulse')
  // Reading the layout restarts the animation when drops come quickly.
  void wheel.offsetWidth
  wheel.classList.add('months-wheel--pulse')
  setTimeout(() => wheel.classList.remove('months-wheel--pulse'), PULSE_MS)
}

// The modern CHamoru form only. Where the field holds a second form after a
// slash (Septiembre/Septembre), the game shows the first. cultural_note is
// not read.
const firstForm = (chamorro) => (chamorro ?? '').split('/')[0].trim()

async function fetchMonths() {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('id, chamorro, english')
    .ilike('category', 'months of the year')
    .eq('verified', true)
  if (error) throw error
  const byMonth = new Map()
  for (const row of data ?? []) {
    const target = MONTHS.findIndex((m) => m.toLowerCase() === (row.english ?? '').trim().toLowerCase())
    if (target < 0) continue
    byMonth.set(target, [...(byMonth.get(target) ?? []), row])
  }
  const missing = MONTHS.filter((_, i) => !byMonth.has(i))
  const doubled = MONTHS.filter((_, i) => (byMonth.get(i)?.length ?? 0) > 1)
  if (missing.length || doubled.length) return { missing, doubled }
  return {
    words: MONTHS.map((_, i) => {
      const row = byMonth.get(i)[0]
      return { id: row.id, display: firstForm(row.chamorro), target: i }
    }),
  }
}

function MonthsGame() {
  const [words, setWords] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const {
    tray, placed, held, hoverTarget, shake, finished, showPlayAgain, live,
    placedCount, total, wordById,
    rootRef, boardRef, playAgainRef,
    cardProps, targetProps, deal, playAgain,
  } = usePlacementGame({
    words,
    targetNames: MONTHS,
    targetNoun: 'position',
    mode: 'months',
    burstCount: 80,
    itemNoun: 'months',
  })

  // Pulse the wheel whenever a word is placed. A layout effect runs before
  // the browser paints, so the pulse starts on the same frame as the
  // sparkle the hook fires for that drop.
  const lastCount = useRef(0)
  useLayoutEffect(() => {
    if (placedCount > lastCount.current) pulseWheel(boardRef.current)
    lastCount.current = placedCount
  }, [placedCount, boardRef])

  useEffect(() => {
    let cancelled = false
    fetchMonths()
      .then((result) => {
        if (cancelled) return
        if (result.words) {
          setWords(result.words)
          deal(result.words)
        } else {
          setLoadError(result)
        }
      })
      .catch(() => { if (!cancelled) setLoadError({ network: true }) })
    return () => { cancelled = true }
  }, [deal])

  const header = (
    <header className="match-game__header">
      <a className="match-game__home" href="/practice">← Games</a>
      <span className="match-game__brand">JAID</span>
      <span className="match-game__progress">
        {words ? `${placedCount} / ${total}` : 'Months of the Year'}
      </span>
    </header>
  )

  if (loadError) {
    const parts = []
    if (loadError.missing?.length) parts.push(`missing: ${loadError.missing.join(', ')}`)
    if (loadError.doubled?.length) parts.push(`more than one word for: ${loadError.doubled.join(', ')}`)
    return (
      <div className="match-game months-game">
        {header}
        <p className="match-game__status match-game__status--error" role="alert">
          {loadError.network
            ? 'Could not load the months of the year. Check your connection and try again.'
            : `The months of the year are not ready yet (${parts.join('; ')}).`}
        </p>
      </div>
    )
  }

  if (!words) {
    return (
      <div className="match-game months-game">
        {header}
        <p className="match-game__status" role="status">Loading the months…</p>
      </div>
    )
  }

  return (
    <div
      className={`match-game months-game${held != null ? ' months-game--holding' : ''}`}
      ref={rootRef}
    >
      {header}

      <main className="months-board">
        <h1 className="months-board__title">Months of the Year</h1>
        <p className="match-game__instructions months-board__instructions">
          Drag each CHamoru month to its English month on the wheel. You can also tap a card, then tap a month.
        </p>

        <div className="months-play">
          <ul className="months-tray" aria-label="CHamoru months to place">
            {tray.map((id, i) => {
              if (id == null) return <li key={`gap-${i}`} className="months-tray__gap" aria-hidden="true" />
              const word = wordById(id)
              const cls = [
                'months-card',
                held === id && 'months-card--held',
                shake === id && 'months-card--wrong',
              ].filter(Boolean).join(' ')
              return (
                <li key={id} className="months-tray__item">
                  <button type="button" className={cls} {...cardProps(id)}>
                    {word.display}
                  </button>
                </li>
              )
            })}
          </ul>

          <ol
            className="months-wheel"
            ref={boardRef}
            aria-label="Months of the year, January to December"
          >
            {MONTHS.map((month, i) => {
              const word = placed[i] != null ? wordById(placed[i]) : null
              const cls = [
                'months-pos',
                `months-pos--${SEASONS[i]}`,
                word && 'months-pos--correct',
                hoverTarget === i && 'months-pos--hover',
              ].filter(Boolean).join(' ')
              return (
                <li key={month} className="months-wheel__item" style={WHEEL_SPOTS[i]}>
                  <button
                    type="button"
                    className={cls}
                    aria-label={word ? `${month} position, ${word.display}, correct` : `${month} position, empty`}
                    {...targetProps(i)}
                  >
                    <span className="months-pos__month">{month}</span>
                    <span className="months-pos__drop">
                      {word && <span className="months-pos__word">{word.display}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        {finished && (
          <div className="months-finish">
            {prefersReducedMotion() && <p className="months-finish__text">Complete!</p>}
            {showPlayAgain && (
              <button
                type="button"
                ref={playAgainRef}
                className="match-game__btn months-finish__btn"
                onClick={playAgain}
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </main>

      <p className="months-sr-only" role="status" aria-live="polite">{live}</p>
    </div>
  )
}

export default MonthsGame
