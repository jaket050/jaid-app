import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { logEvent } from '../utils/logEvent'

// Shared play logic for the drag to place games (Months of the Year; the
// Days of the Week game has the same logic inline). Each word belongs in
// one target. Learners drag a card from the tray onto a target, or pick a
// card up with a tap, Enter or Space, move between targets with the arrow
// keys, and drop with a tap, Enter or Space. Escape puts the card back.
//
// words:       [{ id, display, target }], target is the index of its target;
//              null while loading. Call deal(words) once they arrive.
// targetNames: English name of each target, for announcements
// targetNoun:  'slot' or 'position', for announcements
// mode:        learner_events mode for answer_submitted
// burstCount:  confetti particles on completion
// itemNoun:    plural noun for the completion message ('days', 'months')

// Movement in px before a press on a card counts as a drag instead of a tap.
const DRAG_THRESHOLD = 6
const SNAP_BACK_MS = 180
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

export function usePlacementGame({ words, targetNames, targetNoun, mode, burstCount, itemNoun }) {
  // Tray positions, each a word id or null once that card is placed.
  const [tray, setTray] = useState([])
  // Target index → placed word id.
  const [placed, setPlaced] = useState({})
  const [held, setHeld] = useState(null)
  const [hoverTarget, setHoverTarget] = useState(null)
  const [shake, setShake] = useState(null)
  const [finished, setFinished] = useState(false)
  const [showPlayAgain, setShowPlayAgain] = useState(false)
  const [live, setLive] = useState('')

  const rootRef = useRef(null)
  const boardRef = useRef(null)
  const targetRefs = useRef([])
  const cardRefs = useRef({})
  const playAgainRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const lastDeal = useRef(null)

  useEffect(() => {
    if (showPlayAgain) playAgainRef.current?.focus()
  }, [showPlayAgain])

  const wordById = (id) => words.find((w) => w.id === id)
  const total = targetNames.length
  const placedCount = Object.keys(placed).length
  const emptyTargets = targetNames.map((_, i) => i).filter((i) => placed[i] == null)

  // Polite announcements; a trailing space toggles so a repeated message is
  // read again.
  const announce = (text) => setLive((prev) => (prev === text ? `${text} ` : text))

  function finish() {
    setFinished(true)
    if (prefersReducedMotion()) {
      announce(`All ${total} ${itemNoun} are in place. Complete!`)
      setShowPlayAgain(true)
      return
    }
    announce(`All ${total} ${itemNoun} are in place!`)
    const burst = confetti({
      particleCount: burstCount,
      spread: 100,
      startVelocity: 32,
      ticks: 150,
      shapes: ['star'],
      colors: [accentColor(rootRef.current)],
      origin: originOf(boardRef.current),
      disableForReducedMotion: true,
    })
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000))
    Promise.race([burst ?? Promise.resolve(), timeout]).then(() => setShowPlayAgain(true))
  }

  function sparkle(index) {
    if (prefersReducedMotion()) return
    const el = targetRefs.current[index]
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

  // Returns true when the word belongs on the target.
  function drop(id, index) {
    const word = wordById(id)
    const name = targetNames[index]
    const correct = placed[index] == null && word.target === index
    logEvent('answer_submitted', { mode, word_id: id, correct })
    setHeld(null)
    setHoverTarget(null)
    if (correct) {
      setPlaced((prev) => ({ ...prev, [index]: id }))
      setTray((prev) => prev.map((t) => (t === id ? null : t)))
      announce(`${word.display} placed in ${name} ${targetNoun}, correct`)
      sparkle(index)
      if (placedCount + 1 === total) finish()
    } else {
      announce(`${word.display} rejected from ${name} ${targetNoun}`)
    }
    return correct
  }

  function startShake(id) {
    if (prefersReducedMotion()) return
    setShake(null)
    requestAnimationFrame(() => setShake(id))
  }

  // ─── Keyboard and tap: pick up a card, then choose a target ─────────────

  function onCardClick(id) {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (finished) return
    const word = wordById(id)
    if (held === id) {
      setHeld(null)
      announce(`${word.display} put back`)
      return
    }
    setHeld(id)
    announce(`picked up ${word.display}. Use the arrow keys to choose a ${targetNoun}, then Enter to drop.`)
  }

  function focusTarget(index) {
    targetRefs.current[index]?.focus()
  }

  function onCardKeyDown(e, id) {
    if (held !== id) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onCardClick(id)
    } else if (['ArrowRight', 'ArrowDown'].includes(e.key) && emptyTargets.length) {
      e.preventDefault()
      focusTarget(emptyTargets[0])
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key) && emptyTargets.length) {
      e.preventDefault()
      focusTarget(emptyTargets[emptyTargets.length - 1])
    }
  }

  function onTargetKeyDown(e, index) {
    if (held == null) return
    const at = emptyTargets.indexOf(index)
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      focusTarget(emptyTargets[(at + 1) % emptyTargets.length])
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      focusTarget(emptyTargets[(at - 1 + emptyTargets.length) % emptyTargets.length])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      const id = held
      setHeld(null)
      announce(`${wordById(id).display} put back`)
      cardRefs.current[id]?.focus()
    }
  }

  function onTargetClick(index) {
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

  function targetAt(x, y) {
    return targetRefs.current.findIndex((el) => {
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
  // since the drag began, and marks the empty target it is over.
  function followPointer() {
    const d = drag.current
    const el = cardRefs.current[d.id]
    const dy = d.lastY - d.y + (window.scrollY - d.scrollY)
    el.style.transform = `translate(${d.lastX - d.x}px, ${dy}px)`
    const over = targetAt(d.lastX, d.lastY)
    setHoverTarget(over >= 0 && placed[over] == null ? over : null)
  }

  // While a drag is held near the top or bottom of the window, scroll the
  // page so targets below the fold can be reached.
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
      cardRefs.current[d.id].classList.add('is-dragging')
      d.frame = requestAnimationFrame(autoScroll)
    }
    followPointer()
  }

  function snapBack(id, wrong) {
    const el = cardRefs.current[id]
    if (!el) return
    el.classList.remove('is-dragging')
    if (prefersReducedMotion()) {
      el.style.transform = ''
      return
    }
    el.classList.add('is-returning')
    el.style.transform = ''
    setTimeout(() => {
      el.classList.remove('is-returning')
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
    setHoverTarget(null)
    const index = targetAt(e.clientX, e.clientY)
    if (index < 0) {
      snapBack(d.id, false)
      return
    }
    const correct = drop(d.id, index)
    if (!correct) snapBack(d.id, true)
  }

  function onPointerCancel(e) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    cancelAnimationFrame(d.frame)
    setHoverTarget(null)
    if (d.moved) snapBack(d.id, false)
  }

  // The first deal, once the words have loaded. Stable across renders, so
  // a fetch effect can list it as a dependency.
  const deal = useCallback((list) => {
    const order = scramble(list.map((w) => w.id))
    lastDeal.current = order
    setTray(order)
  }, [])

  function playAgain() {
    const deal = scramble(words.map((w) => w.id), lastDeal.current)
    lastDeal.current = deal
    setTray(deal)
    setPlaced({})
    setHeld(null)
    setShake(null)
    setFinished(false)
    setShowPlayAgain(false)
    announce(`New round. The ${itemNoun} are mixed up again.`)
    requestAnimationFrame(() => cardRefs.current[deal[0]]?.focus())
  }

  // Props for each tray card button.
  const cardProps = (id) => ({
    ref: (el) => { cardRefs.current[id] = el },
    'aria-pressed': held === id,
    disabled: finished,
    onClick: () => onCardClick(id),
    onKeyDown: (e) => onCardKeyDown(e, id),
    onPointerDown: (e) => onPointerDown(e, id),
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onAnimationEnd: () => setShake(null),
  })

  // Props for each target button.
  const targetProps = (index) => ({
    ref: (el) => { targetRefs.current[index] = el },
    tabIndex: -1,
    'aria-disabled': placed[index] != null || held == null,
    onClick: () => onTargetClick(index),
    onKeyDown: (e) => onTargetKeyDown(e, index),
  })

  return {
    tray, placed, held, hoverTarget, shake, finished, showPlayAgain, live,
    placedCount, total, wordById,
    rootRef, boardRef, playAgainRef,
    cardProps, targetProps, deal, playAgain,
  }
}
