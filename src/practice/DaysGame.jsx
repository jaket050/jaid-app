import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { logEvent } from '../utils/logEvent'
import './match.css'
import './days.css'

// Slot order, Sunday first. Each verified "Days of the Week" row is matched
// to its slot by its English field.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Movement in px before a press on a card counts as a drag instead of a tap.
const DRAG_THRESHOLD = 6
const SNAP_BACK_MS = 180
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Modern CHamoru only: cultural_note (the traditional forms) is not read.
async function fetchDays() {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('id, chamorro, english')
    .ilike('category', 'days of the week')
    .eq('verified', true)
  if (error) throw error
  const byDay = new Map()
  for (const row of data ?? []) {
    const day = WEEKDAYS.find((d) => d.toLowerCase() === (row.english ?? '').trim().toLowerCase())
    if (!day) continue
    byDay.set(day, [...(byDay.get(day) ?? []), row])
  }
  const missing = WEEKDAYS.filter((d) => !byDay.has(d))
  const doubled = WEEKDAYS.filter((d) => (byDay.get(d)?.length ?? 0) > 1)
  if (missing.length || doubled.length) return { missing, doubled }
  return { words: WEEKDAYS.map((d) => byDay.get(d)[0]) }
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A random order that differs from the solved order and from the last deal.
function scramble(ids, previous) {
  for (let tries = 0; tries < 50; tries++) {
    const next = shuffle(ids)
    if (next.join() !== ids.join() && next.join() !== previous?.join()) return next
  }
  return shuffle(ids)
}

function accentColor(el) {
  const value = el && getComputedStyle(el).getPropertyValue('--ui-accent').trim()
  return value || '#C9A84C'
}

// A point at the center of an element, in canvas-confetti's 0 to 1 units.
function originOf(el) {
  const r = el.getBoundingClientRect()
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  }
}

function DaysGame() {
  const [words, setWords] = useState(null)
  const [loadError, setLoadError] = useState(null)
  // Tray positions, each a word id or null once that card is placed.
  const [tray, setTray] = useState([])
  // Slot index → placed word id.
  const [placed, setPlaced] = useState({})
  const [held, setHeld] = useState(null)
  const [hoverSlot, setHoverSlot] = useState(null)
  const [shake, setShake] = useState(null)
  const [finished, setFinished] = useState(false)
  const [showPlayAgain, setShowPlayAgain] = useState(false)
  const [live, setLive] = useState('')

  const rootRef = useRef(null)
  const slotsRef = useRef(null)
  const slotRefs = useRef([])
  const cardRefs = useRef({})
  const playAgainRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const lastDeal = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchDays()
      .then((result) => {
        if (cancelled) return
        if (result.words) {
          setWords(result.words)
          const deal = scramble(result.words.map((w) => w.id))
          lastDeal.current = deal
          setTray(deal)
        } else {
          setLoadError(result)
        }
      })
      .catch(() => { if (!cancelled) setLoadError({ network: true }) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (showPlayAgain) playAgainRef.current?.focus()
  }, [showPlayAgain])

  const wordById = (id) => words.find((w) => w.id === id)
  const placedCount = Object.keys(placed).length
  const emptySlots = WEEKDAYS.map((_, i) => i).filter((i) => placed[i] == null)

  // Polite announcements; a trailing space toggles so a repeated message is
  // read again.
  const announce = (text) => setLive((prev) => (prev === text ? `${text} ` : text))

  function finish() {
    setFinished(true)
    if (prefersReducedMotion()) {
      announce('All seven days are in order. Complete!')
      setShowPlayAgain(true)
      return
    }
    announce('All seven days are in order!')
    const burst = confetti({
      particleCount: 60,
      spread: 100,
      startVelocity: 32,
      ticks: 150,
      shapes: ['star'],
      colors: [accentColor(rootRef.current)],
      origin: originOf(slotsRef.current),
      disableForReducedMotion: true,
    })
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000))
    Promise.race([burst ?? Promise.resolve(), timeout]).then(() => setShowPlayAgain(true))
  }

  function sparkle(slotIndex) {
    if (prefersReducedMotion()) return
    const el = slotRefs.current[slotIndex]
    if (!el) return
    confetti({
      particleCount: 3,
      spread: 70,
      startVelocity: 9,
      gravity: 0.5,
      ticks: 50,
      scalar: 0.6,
      shapes: ['star'],
      colors: [accentColor(rootRef.current), '#E8C97A'],
      origin: originOf(el),
      disableForReducedMotion: true,
    })
  }

  // Returns true when the word belongs in the slot.
  function drop(id, slotIndex) {
    const word = wordById(id)
    const day = WEEKDAYS[slotIndex]
    const correct = placed[slotIndex] == null && word.english.trim().toLowerCase() === day.toLowerCase()
    logEvent('answer_submitted', { mode: 'days', word_id: id, correct })
    setHeld(null)
    setHoverSlot(null)
    if (correct) {
      setPlaced((prev) => ({ ...prev, [slotIndex]: id }))
      setTray((prev) => prev.map((t) => (t === id ? null : t)))
      announce(`${word.chamorro} placed in ${day} slot, correct`)
      sparkle(slotIndex)
      if (placedCount + 1 === WEEKDAYS.length) finish()
    } else {
      announce(`${word.chamorro} rejected from ${day} slot`)
    }
    return correct
  }

  function startShake(id) {
    if (prefersReducedMotion()) return
    setShake(null)
    requestAnimationFrame(() => setShake(id))
  }

  // ─── Keyboard and tap: pick up a card, then choose a slot ───────────────

  function onCardClick(id) {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (finished) return
    const word = wordById(id)
    if (held === id) {
      setHeld(null)
      announce(`${word.chamorro} put back`)
      return
    }
    setHeld(id)
    announce(`picked up ${word.chamorro}. Use the arrow keys to choose a day, then Enter to drop.`)
  }

  function focusSlot(index) {
    slotRefs.current[index]?.focus()
  }

  function onCardKeyDown(e, id) {
    if (held !== id) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onCardClick(id)
    } else if (['ArrowRight', 'ArrowDown'].includes(e.key) && emptySlots.length) {
      e.preventDefault()
      focusSlot(emptySlots[0])
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key) && emptySlots.length) {
      e.preventDefault()
      focusSlot(emptySlots[emptySlots.length - 1])
    }
  }

  function onSlotKeyDown(e, index) {
    if (held == null) return
    const at = emptySlots.indexOf(index)
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      focusSlot(emptySlots[(at + 1) % emptySlots.length])
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      focusSlot(emptySlots[(at - 1 + emptySlots.length) % emptySlots.length])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      const id = held
      setHeld(null)
      announce(`${wordById(id).chamorro} put back`)
      cardRefs.current[id]?.focus()
    }
  }

  function onSlotClick(index) {
    if (held == null || finished) return
    const id = held
    const correct = drop(id, index)
    if (correct) {
      // Focus the next card still in the tray, if any.
      const next = tray.find((t) => t != null && t !== id)
      if (next != null) requestAnimationFrame(() => cardRefs.current[next]?.focus())
    } else {
      cardRefs.current[id]?.focus()
      startShake(id)
    }
  }

  // ─── Pointer drag (mouse, touch and pen) ────────────────────────────────

  function slotAt(x, y) {
    return slotRefs.current.findIndex((el) => {
      if (!el) return false
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    })
  }

  function onPointerDown(e, id) {
    if (finished || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      id, pointerId: e.pointerId, x: e.clientX, y: e.clientY,
      lastX: e.clientX, lastY: e.clientY, scrollY: window.scrollY, moved: false, frame: null,
    }
  }

  // Places the dragged card under the pointer, counting any page scroll
  // since the drag began, and marks the empty slot it is over.
  function followPointer() {
    const d = drag.current
    const el = cardRefs.current[d.id]
    const dy = d.lastY - d.y + (window.scrollY - d.scrollY)
    el.style.transform = `translate(${d.lastX - d.x}px, ${dy}px)`
    const over = slotAt(d.lastX, d.lastY)
    setHoverSlot(over >= 0 && placed[over] == null ? over : null)
  }

  // While a drag is held near the top or bottom of the window, scroll the
  // page so slots below the fold on a phone can be reached.
  function autoScroll() {
    const d = drag.current
    if (!d?.moved) return
    const edge = 56
    const speed = d.lastY > window.innerHeight - edge ? 8 : d.lastY < edge ? -8 : 0
    if (speed) {
      window.scrollBy(0, speed)
      followPointer()
    }
    d.frame = requestAnimationFrame(autoScroll)
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    d.lastX = e.clientX
    d.lastY = e.clientY
    if (!d.moved && Math.hypot(d.lastX - d.x, d.lastY - d.y) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setHeld(null)
      cardRefs.current[d.id].classList.add('days-card--dragging')
      d.frame = requestAnimationFrame(autoScroll)
    }
    followPointer()
  }

  function snapBack(id, wrong) {
    const el = cardRefs.current[id]
    if (!el) return
    el.classList.remove('days-card--dragging')
    if (prefersReducedMotion()) {
      el.style.transform = ''
      return
    }
    el.classList.add('days-card--returning')
    el.style.transform = ''
    setTimeout(() => {
      el.classList.remove('days-card--returning')
      if (wrong) startShake(id)
    }, SNAP_BACK_MS)
  }

  function onPointerUp(e) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    cancelAnimationFrame(d.frame)
    if (!d.moved) return
    suppressClick.current = true
    // A click does not always follow a drag, so clear the flag after this
    // event either way.
    setTimeout(() => { suppressClick.current = false }, 0)
    setHoverSlot(null)
    const slot = slotAt(e.clientX, e.clientY)
    if (slot < 0) {
      snapBack(d.id, false)
      return
    }
    const correct = drop(d.id, slot)
    if (!correct) snapBack(d.id, true)
  }

  function onPointerCancel(e) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    cancelAnimationFrame(d.frame)
    setHoverSlot(null)
    if (d.moved) snapBack(d.id, false)
  }

  function playAgain() {
    const deal = scramble(words.map((w) => w.id), lastDeal.current)
    lastDeal.current = deal
    setTray(deal)
    setPlaced({})
    setHeld(null)
    setShake(null)
    setFinished(false)
    setShowPlayAgain(false)
    announce('New round. The days are mixed up again.')
    requestAnimationFrame(() => cardRefs.current[deal[0]]?.focus())
  }

  const header = (
    <header className="match-game__header">
      <a className="match-game__home" href="/practice">← Games</a>
      <span className="match-game__brand">JAID</span>
      <span className="match-game__progress">
        {words ? `${placedCount} / ${WEEKDAYS.length}` : 'Days of the Week'}
      </span>
    </header>
  )

  if (loadError) {
    const parts = []
    if (loadError.missing?.length) parts.push(`missing: ${loadError.missing.join(', ')}`)
    if (loadError.doubled?.length) parts.push(`more than one word for: ${loadError.doubled.join(', ')}`)
    return (
      <div className="match-game days-game" ref={rootRef}>
        {header}
        <p className="match-game__status match-game__status--error" role="alert">
          {loadError.network
            ? 'Could not load the days of the week. Check your connection and try again.'
            : `The days of the week are not ready yet (${parts.join('; ')}).`}
        </p>
      </div>
    )
  }

  if (!words) {
    return (
      <div className="match-game days-game" ref={rootRef}>
        {header}
        <p className="match-game__status" role="status">Loading the days…</p>
      </div>
    )
  }

  return (
    <div className={`match-game days-game${held != null ? ' days-game--holding' : ''}`} ref={rootRef}>
      {header}

      <main className="days-board">
        <h1 className="days-board__title">Days of the Week</h1>
        <p className="match-game__instructions days-board__instructions">
          Drag each CHamoru day to its English day. You can also tap a card, then tap a day.
        </p>

        <ul className="days-row days-tray" aria-label="CHamoru days to place">
          {tray.map((id, i) => {
            if (id == null) return <li key={`gap-${i}`} className="days-tray__gap" aria-hidden="true" />
            const word = wordById(id)
            const cls = [
              'days-card',
              held === id && 'days-card--held',
              shake === id && 'days-card--wrong',
            ].filter(Boolean).join(' ')
            return (
              <li key={id} className="days-tray__item">
                <button
                  type="button"
                  ref={(el) => { cardRefs.current[id] = el }}
                  className={cls}
                  aria-pressed={held === id}
                  disabled={finished}
                  onClick={() => onCardClick(id)}
                  onKeyDown={(e) => onCardKeyDown(e, id)}
                  onPointerDown={(e) => onPointerDown(e, id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  onAnimationEnd={() => setShake(null)}
                >
                  {word.chamorro}
                </button>
              </li>
            )
          })}
        </ul>

        <ol className="days-row days-slots" ref={slotsRef} aria-label="Days of the week, Sunday to Saturday">
          {WEEKDAYS.map((day, i) => {
            const word = placed[i] != null ? wordById(placed[i]) : null
            const cls = [
              'days-slot',
              word && 'days-slot--correct',
              hoverSlot === i && 'days-slot--hover',
            ].filter(Boolean).join(' ')
            return (
              <li key={day} className="days-slots__item">
                <button
                  type="button"
                  ref={(el) => { slotRefs.current[i] = el }}
                  className={cls}
                  tabIndex={-1}
                  aria-label={word ? `${day} slot, ${word.chamorro}, correct` : `${day} slot, empty`}
                  aria-disabled={word != null || held == null}
                  onClick={() => onSlotClick(i)}
                  onKeyDown={(e) => onSlotKeyDown(e, i)}
                >
                  {/* Full name, or the three letter form (Sun, Mon...) where the
                      full name cannot fit one line at 16px; days.css picks. The
                      button's aria-label always gives the full name. */}
                  <span className="days-slot__day">
                    <span className="days-slot__day-full">{day}</span>
                    <span className="days-slot__day-short">{day.slice(0, 3)}</span>
                  </span>
                  <span className="days-slot__drop">
                    {word && <span className="days-slot__word">{word.chamorro}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {finished && (
          <div className="days-finish">
            {prefersReducedMotion() && <p className="days-finish__text">Complete!</p>}
            {showPlayAgain && (
              <button type="button" ref={playAgainRef} className="match-game__btn days-finish__btn" onClick={playAgain}>
                Play Again
              </button>
            )}
          </div>
        )}
      </main>

      <p className="days-sr-only" role="status" aria-live="polite">{live}</p>
    </div>
  )
}

export default DaysGame
