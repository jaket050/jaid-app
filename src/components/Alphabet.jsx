import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { chamorroAlphabet, vowels, pronunciationNotes } from '../data/alphabet'

// Above this width the details panel is a side column with a letter always
// selected; at or below it the panel is a sheet pinned to the bottom.
const DESKTOP_QUERY = '(min-width: 1025px)'
const isDesktopNow = () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'vowel', label: 'Vowels' },
  { value: 'consonant', label: 'Consonants' },
]

// A letter stored with its name in brackets, like the glottal stop, shows
// the mark large and the bracketed name as a small label. Both parts come
// straight from the stored string; other letters have no brackets.
function splitLetter(letter) {
  const m = letter.match(/^(.*?)\s*\((.+)\)$/)
  return m ? { mark: m[1], label: m[2] } : { mark: letter, label: null }
}

const isVowel = (item) => vowels.includes(item.letter)

function LetterDetail({ item }) {
  const { mark, label } = splitLetter(item.letter)
  return (
    <div className={`alphabet-detail__body${isVowel(item) ? ' alphabet-detail__body--vowel' : ''}`}>
      <div className="alphabet-detail__head">
        <span className={`alphabet-detail__letter${label ? ' alphabet-detail__letter--mark' : ''}`}>{mark}</span>
        <span className="alphabet-detail__labels">
          {label && <span className="alphabet-detail__name">{label}</span>}
          <span className="alphabet-detail__type">{item.type}</span>
        </span>
      </div>
      <p className="alphabet-detail__pronunciation">{item.pronunciation}</p>
      {item.example ? (
        <p className="alphabet-detail__example">
          <span className="alphabet-detail__chamorro">{item.example}</span>
          <span className="alphabet-detail__english">{item.exampleEnglish}</span>
        </p>
      ) : (
        <p className="alphabet-detail__pending">Example coming soon</p>
      )}
      {item.note && <p className="alphabet-detail__note">{item.note}</p>}
    </div>
  )
}

function Alphabet({ onExit }) {
  const [isDesktop, setIsDesktop] = useState(isDesktopNow)
  const [filter, setFilter] = useState('all')
  // Desktop opens with the first letter selected, so the panel is never
  // empty; phones open with nothing selected and no sheet.
  const [selected, setSelected] = useState(() => (isDesktopNow() ? chamorroAlphabet[0].letter : null))
  const [sheetH, setSheetH] = useState(0)
  const sheetRef = useRef(null)

  const visible = chamorroAlphabet.filter((item) => filter === 'all' || item.type === filter)
  const selectedItem = chamorroAlphabet.find((item) => item.letter === selected) ?? null

  // Follow the breakpoint. Moving to desktop with nothing selected selects
  // the first visible letter.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => {
      setIsDesktop(mq.matches)
      if (mq.matches) setSelected((prev) => prev ?? chamorroAlphabet[0].letter)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // On phones, Escape closes the sheet.
  useEffect(() => {
    if (isDesktop || !selected) return
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, selected])

  // The sheet's height, so the page can pad its bottom and the sheet never
  // covers the last row of cards or the notes.
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSheetH(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [isDesktop, selected])

  function changeFilter(value) {
    setFilter(value)
    const nowVisible = chamorroAlphabet.filter((item) => value === 'all' || item.type === value)
    if (selected && !nowVisible.some((item) => item.letter === selected)) {
      // Desktop keeps a letter selected; phones close the sheet.
      setSelected(isDesktop ? nowVisible[0]?.letter ?? null : null)
    }
  }

  function pressLetter(letter) {
    if (!isDesktop && selected === letter) setSelected(null)
    else setSelected(letter)
  }

  const sheetOpen = !isDesktop && selectedItem
  const showPanel = isDesktop || sheetOpen

  return (
    <div
      className="alphabet-page"
      style={sheetOpen && sheetH ? { paddingBottom: `${sheetH}px` } : undefined}
    >
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress" aria-hidden="true" />
      </div>

      <div className="alphabet-content">
        <div className="alphabet-intro">
          <h1 className="alphabet-intro__title">I Atfabetu</h1>
          <p className="alphabet-intro__sub">The CHamoru Alphabet</p>
          <p className="alphabet-intro__meta">24 letters · 6 vowels · 18 consonants</p>
        </div>

        <div className="alphabet-filter">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="alphabet-filter__btn"
              aria-pressed={filter === f.value}
              onClick={() => changeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="alphabet-main">
          <div className="alphabet-grid">
            {visible.map((item) => {
              const { mark, label } = splitLetter(item.letter)
              const isSelected = item.letter === selected
              return (
                <button
                  key={item.letter}
                  type="button"
                  className={`alphabet-card${isVowel(item) ? ' alphabet-card--vowel' : ''}${isSelected ? ' alphabet-card--selected' : ''}`}
                  aria-pressed={isSelected}
                  aria-controls="alphabet-detail"
                  onClick={() => pressLetter(item.letter)}
                >
                  <span className={`alphabet-card__letter${label ? ' alphabet-card__letter--mark' : ''}`}>{mark}</span>
                  {label && <span className="alphabet-card__name">{label}</span>}
                  <span className="alphabet-card__type">{item.type}</span>
                </button>
              )
            })}
          </div>

          {showPanel && (
            <aside
              id="alphabet-detail"
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
              {selectedItem && <LetterDetail item={selectedItem} />}
            </aside>
          )}
        </div>

        {/* Always present, so the new letter is announced when the panel
            changes or the sheet opens. Text comes from the data. */}
        <p className="alphabet-sr-only" aria-live="polite">
          {selectedItem ? `${selectedItem.letter}, ${selectedItem.type}. ${selectedItem.pronunciation}` : ''}
        </p>

        <div className="pronunciation-notes">
          <h3 className="pronunciation-notes__title">Pronunciation Guide</h3>
          {pronunciationNotes.map((item) => (
            <div key={item.label} className="pronunciation-note">
              <span className="pronunciation-note__label">{item.label}</span>
              <p className="pronunciation-note__text">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="dialect-note">
          <h3 className="dialect-note__title">A Note on Dialect</h3>
          <p className="dialect-note__text">
            JAID follows the official CHamoru orthography established
            by Kumisión i Fino' CHamoru, which reflects the Guåhan
            standard. CHamoru is also spoken in the Northern Mariana
            Islands with some differences in vocabulary and spelling.
            Both dialects are part of the living language and carry
            equal cultural value. As JAID grows we aim to acknowledge
            and honor both.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Alphabet
