import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'

// The numbers page reuses the alphabet page's layout and classes
// (.alphabet-*), with a few .numbers-* rules in App.css. Words come from the
// vocabulary App.jsx already loads; the two number systems are paired by the
// number in each English gloss, such as "Eleven (11)".

// Above this width the details panel is a side column with a number always
// selected; at or below it the panel is a sheet pinned to the bottom.
const DESKTOP_QUERY = '(min-width: 1025px)'
const isDesktopNow = () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches

const PRISENTE = 'Numbers Prisente'
const ANSIANU = 'Numbers Ansiånu'

// The filter chooses which system leads on each card and in the details;
// every number stays visible. Labels are the systems' names as stored in
// the category names.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'prisente', label: 'Prisente' },
  { value: 'ansianu', label: 'Ansiånu' },
]

const SYSTEM_NAMES = { prisente: 'Prisente', ansianu: 'Ansiånu' }

// Reference shows every form. Practice shows only the numerals; tapping a
// number reveals its forms in place, and the details panel is hidden since
// it would give the answer away. The mode is not saved between visits.
const MODES = [
  { value: 'reference', label: 'Reference' },
  { value: 'practice', label: 'Practice' },
]

const valueOf = (english) => {
  const m = english?.match(/\((\d+)\)/)
  return m ? Number(m[1]) : null
}

// One entry per value, in value order, with the Prisente and Ansiånu rows.
function pairNumbers(words) {
  const byValue = new Map()
  for (const w of words) {
    const system = w.category === PRISENTE ? 'prisente' : w.category === ANSIANU ? 'ansianu' : null
    if (!system) continue
    const value = valueOf(w.english)
    if (value === null) continue
    if (!byValue.has(value)) byValue.set(value, { value, prisente: null, ansianu: null })
    byValue.get(value)[system] = w
  }
  return [...byValue.values()].sort((a, b) => a.value - b.value)
}

// The grid holds the counting run from the smallest value (1 to 21); a
// value after a wide gap (21 to 38) is an example of a bigger number and
// goes to the panel below the grid instead.
//
// Why the threshold: only verified rows reach learners, so a number can be
// missing from the middle of the run while it waits for verification (an
// unverified 16). Splitting on any gap would then move 17 to 21 out of the
// grid and into the panel. A gap of up to MAX_MISSING missing values stays
// in the grid; a wider one marks the start of the bigger numbers. Keep it
// well below the jump to the first example (16 missing between 21 and 38).
const MAX_MISSING = 3

function splitRun(numbers) {
  const run = []
  for (const item of numbers) {
    const missing = run.length === 0 ? 0 : item.value - run[run.length - 1].value - 1
    if (missing > MAX_MISSING) break
    run.push(item)
  }
  return { run, bigger: numbers.slice(run.length) }
}

// PLACEHOLDER: how each system builds numbers past twenty. Leave null until
// the Kumisión i Fino' CHamoru has supplied or approved the text; while
// null, the panel shows "Explanation coming soon".
const BUILD_NOTES = {
  prisente: null,
  ansianu: null,
}

function BiggerNumbers({ items, filter, practice, revealed, onToggle }) {
  const systems = filter === 'ansianu' ? ['ansianu', 'prisente'] : ['prisente', 'ansianu']
  return (
    <section className="pronunciation-notes numbers-bigger" aria-labelledby="numbers-bigger-title">
      <h3 id="numbers-bigger-title" className="pronunciation-notes__title">Bigger numbers</h3>
      {items.map((item) => {
        if (!practice) {
          return (
            <div key={item.value} className="numbers-bigger__example">
              <span className="numbers-bigger__value">{item.value}</span>
              <div className="numbers-bigger__forms">
                {ordered(item, filter).map(([system, w]) => (
                  <p key={system} className="alphabet-detail__example">
                    <span className="alphabet-detail__chamorro">{w.chamorro}</span>
                    <span className="alphabet-detail__english">{SYSTEM_NAMES[system]}</span>
                  </p>
                ))}
              </div>
            </div>
          )
        }
        // Practice: the row is a button; its forms keep their space while
        // hidden (see .numbers-concealed), so revealing never moves the page.
        // Spans, not paragraphs, since they sit inside a button.
        const isRevealed = revealed.has(item.value)
        return (
          <button
            key={item.value}
            type="button"
            className="numbers-bigger__example numbers-bigger__example--practice"
            aria-label={practiceLabel(item, filter, isRevealed)}
            onClick={() => onToggle(item)}
          >
            <span className="numbers-bigger__value">{item.value}</span>
            <span className={`numbers-bigger__forms${isRevealed ? '' : ' numbers-concealed'}`}>
              {ordered(item, filter).map(([system, w]) => (
                <span key={system} className="alphabet-detail__example">
                  <span className="alphabet-detail__chamorro">{w.chamorro}</span>
                  <span className="alphabet-detail__english">{SYSTEM_NAMES[system]}</span>
                </span>
              ))}
            </span>
          </button>
        )
      })}
      {systems.map((system) => (
        <div key={system} className="pronunciation-note">
          <span className="pronunciation-note__label">{SYSTEM_NAMES[system]}</span>
          {BUILD_NOTES[system] ? (
            <p className="pronunciation-note__text">{BUILD_NOTES[system]}</p>
          ) : (
            <p className="pronunciation-note__text numbers-bigger__pending">Explanation coming soon</p>
          )}
        </div>
      ))}
    </section>
  )
}

// The systems in display order: the chosen one first; All keeps Prisente
// first. Each entry is [system, word]; a missing form is skipped.
function ordered(item, filter) {
  const order = filter === 'ansianu' ? ['ansianu', 'prisente'] : ['prisente', 'ansianu']
  return order.filter((s) => item[s]).map((s) => [s, item[s]])
}

// "Prisente: onse. Ansiånu: månot na gai håcha", in the filter's order.
const formsText = (item, filter) => ordered(item, filter).map(([s, w]) => `${SYSTEM_NAMES[s]}: ${w.chamorro}`).join('. ')

// A Practice card's accessible name: the numeral and whether it is
// revealed, plus the forms once they are showing.
const practiceLabel = (item, filter, isRevealed) =>
  isRevealed ? `${item.value}, revealed. ${formsText(item, filter)}` : `${item.value}, hidden`

// The cultural notes are not shown here. On the Prisente rows the note
// ("Traditional CHamoru: ...") repeats the Ansiånu form, which this page
// already shows as first class data, and several of the Prisente notes
// spell that form differently from the Ansiånu row for the same value; the
// exact set has not been confirmed against the live data. Hidden pending a
// ruling from the Kumisión i Fino' CHamoru; the notes stay in the data and
// still show in Word of the Day and the admin portal.
function NumberDetail({ item, filter }) {
  const forms = ordered(item, filter)
  const english = (item.prisente ?? item.ansianu).english
  return (
    <div className="alphabet-detail__body">
      <div className="alphabet-detail__head">
        <span className="alphabet-detail__letter">{item.value}</span>
        <span className="alphabet-detail__labels">
          <span className="alphabet-detail__name">{english}</span>
        </span>
      </div>
      {forms.map(([system, w]) => (
        <p key={system} className="alphabet-detail__example">
          <span className="alphabet-detail__chamorro">{w.chamorro}</span>
          <span className="alphabet-detail__english">{SYSTEM_NAMES[system]}</span>
        </p>
      ))}
    </div>
  )
}

function Numbers({ words, onExit }) {
  const { run: numbers, bigger } = useMemo(() => splitRun(pairNumbers(words)), [words])
  const [isDesktop, setIsDesktop] = useState(isDesktopNow)
  const [filter, setFilter] = useState('all')
  const [mode, setMode] = useState('reference')
  // Practice: the values whose forms are showing, and the latest reveal
  // for the live region.
  const [revealed, setRevealed] = useState(() => new Set())
  const [practiceNews, setPracticeNews] = useState('')
  const practice = mode === 'practice'
  // Desktop opens with the first number selected, so the panel is never
  // empty; phones open with nothing selected and no sheet.
  const [selected, setSelected] = useState(() => (isDesktopNow() ? numbers[0]?.value ?? null : null))
  const [sheetH, setSheetH] = useState(0)
  const sheetRef = useRef(null)

  const selectedItem = numbers.find((item) => item.value === selected) ?? null

  // Follow the breakpoint. Moving to desktop with nothing selected selects
  // the first number.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => {
      setIsDesktop(mq.matches)
      if (mq.matches) setSelected((prev) => prev ?? numbers[0]?.value ?? null)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [numbers])

  // On phones, Escape closes the sheet.
  useEffect(() => {
    if (isDesktop || selected === null) return
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, selected])

  // The sheet's height, so the page can pad its bottom and the sheet never
  // covers the last row of cards.
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSheetH(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [isDesktop, selected])

  function pressNumber(value) {
    if (!isDesktop && selected === value) setSelected(null)
    else setSelected(value)
  }

  const total = numbers.length + bigger.length
  const allRevealed = total > 0 && revealed.size === total

  function chooseMode(next) {
    if (next === mode) return
    setMode(next)
    if (next === 'practice') {
      // Start each drill with every form hidden. On phones, also drop the
      // selection so the sheet does not reopen on the way back.
      setRevealed(new Set())
      setPracticeNews('')
      if (!isDesktop) setSelected(null)
    }
  }

  // A filter change keeps the revealed set (revealed cards show both forms
  // under any filter) but clears the Practice announcement, which lists the
  // forms in the previous order.
  function chooseFilter(next) {
    setFilter(next)
    if (practice) setPracticeNews('')
  }

  function toggleReveal(item) {
    const next = new Set(revealed)
    if (next.has(item.value)) {
      next.delete(item.value)
      setPracticeNews(`${item.value} hidden`)
    } else {
      next.add(item.value)
      setPracticeNews(`${item.value} revealed. ${formsText(item, filter)}`)
    }
    setRevealed(next)
  }

  // Reveal all and Hide all leave focus where it is; the live region says
  // what happened.
  function toggleAll() {
    if (allRevealed) {
      setRevealed(new Set())
      setPracticeNews('All numbers hidden')
    } else {
      setRevealed(new Set([...numbers, ...bigger].map((item) => item.value)))
      setPracticeNews(`${total} numbers revealed`)
    }
  }

  const sheetOpen = !practice && !isDesktop && selectedItem
  const showPanel = !practice && (isDesktop || sheetOpen)

  return (
    <div
      className={`alphabet-page numbers-page${practice ? ' numbers-page--practice' : ''}`}
      style={sheetOpen && sheetH ? { paddingBottom: `${sheetH}px` } : undefined}
    >
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress" aria-hidden="true" />
      </div>

      <div className="alphabet-content">
        <div className="alphabet-intro">
          <h1 className="alphabet-intro__title">Numbers</h1>
          <p className="alphabet-intro__sub">Prisente and Ansiånu, side by side</p>
          <p className="alphabet-intro__meta">
            {numbers.length > 0 ? `${numbers[0].value} to ${numbers[numbers.length - 1].value} · two systems` : 'Two systems'}
          </p>
        </div>

        <div className="numbers-mode">
          <div className="alphabet-filter numbers-mode__toggle" role="group" aria-label="Mode">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className="alphabet-filter__btn"
                aria-pressed={mode === m.value}
                onClick={() => chooseMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {practice && (
            <button type="button" className="numbers-reveal-all" onClick={toggleAll}>
              {allRevealed ? 'Hide all' : 'Reveal all'}
            </button>
          )}
        </div>

        <div className="alphabet-filter">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="alphabet-filter__btn"
              aria-pressed={filter === f.value}
              onClick={() => chooseFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {numbers.length === 0 ? (
          <p className="alphabet-detail__pending">Number words are being verified. Check back soon.</p>
        ) : (
          <div className="alphabet-main">
            <div className="alphabet-grid">
              {numbers.map((item) => {
                const forms = ordered(item, filter)
                const formSpans = (hidden) => forms.map(([system, w], i) => (
                  <span
                    key={system}
                    className={`${filter === 'all' || i === 0 ? 'alphabet-card__name numbers-card__form' : 'numbers-card__form numbers-card__form--minor'}${hidden ? ' numbers-concealed' : ''}`}
                  >
                    {w.chamorro}
                  </span>
                ))
                if (practice) {
                  // The forms stay in the card while hidden (visibility only),
                  // so a card is the same height hidden or revealed and the
                  // grid never jumps.
                  const isRevealed = revealed.has(item.value)
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className="alphabet-card"
                      aria-label={practiceLabel(item, filter, isRevealed)}
                      onClick={() => toggleReveal(item)}
                    >
                      <span className="alphabet-card__letter">{item.value}</span>
                      {formSpans(!isRevealed)}
                    </button>
                  )
                }
                const isSelected = item.value === selected
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`alphabet-card${isSelected ? ' alphabet-card--selected' : ''}`}
                    aria-pressed={isSelected}
                    aria-controls="numbers-detail"
                    onClick={() => pressNumber(item.value)}
                  >
                    <span className="alphabet-card__letter">{item.value}</span>
                    {formSpans(false)}
                  </button>
                )
              })}
            </div>

            {showPanel && (
              <aside
                id="numbers-detail"
                ref={sheetRef}
                className={`alphabet-detail${isDesktop ? '' : ' alphabet-detail--sheet'}`}
              >
                {!isDesktop && (
                  <button
                    type="button"
                    className="alphabet-detail__close"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                  >
                    <X size={22} aria-hidden="true" />
                  </button>
                )}
                {selectedItem && <NumberDetail item={selectedItem} filter={filter} />}
              </aside>
            )}
          </div>
        )}

        {bigger.length > 0 && (
          <BiggerNumbers items={bigger} filter={filter} practice={practice} revealed={revealed} onToggle={toggleReveal} />
        )}

        {/* Always present, so the new number is announced when the panel
            changes or the sheet opens, and in Practice what was revealed.
            Text comes from the data. */}
        <p className="alphabet-sr-only" aria-live="polite">
          {practice
            ? practiceNews
            : selectedItem
              ? `${selectedItem.value}. ${formsText(selectedItem, filter)}. ${(selectedItem.prisente ?? selectedItem.ansianu).english}`
              : ''}
        </p>
      </div>
    </div>
  )
}

export default Numbers
