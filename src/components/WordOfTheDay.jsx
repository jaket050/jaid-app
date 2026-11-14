import { Fragment, useEffect } from 'react'
import { Calendar, Check } from 'lucide-react'
import { logEvent } from '../utils/logEvent'

// Lets the browser wrap a slash form ("Septiembre/Septembre") after each "/".
// <wbr> adds no character, so the text read aloud and copied is unchanged.
function withSlashBreaks(text) {
  const parts = text.split('/')
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <>/<wbr /></>}
    </Fragment>
  ))
}

// True when the word has an unbroken run of 13 or more characters (no space,
// slash or hyphen to wrap at), so it gets a slightly smaller size on desktop.
function hasLongRun(text) {
  return text.split(/[\s/-]+/).some((seg) => Array.from(seg).length >= 13)
}

function WordOfTheDay({ words, completedIds }) {
  // App.jsx only loads verified rows, so every word here is already verified.
  const verifiedWords = words ?? []

  const start = new Date('2026-01-01')
  const today = new Date()
  const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const word = verifiedWords.length > 0
    ? verifiedWords[dayIndex % verifiedWords.length]
    : null

  const wordId = word?.id ?? null
  const wordCategory = word?.category ?? null

  // Fire-and-forget: one view event per day's word.
  useEffect(() => {
    if (wordId == null) return
    logEvent('word_of_day_viewed', { word_id: wordId, category: wordCategory })
  }, [wordId, wordCategory])

  if (!word) return null

  const isLearned = completedIds?.has(word.id)

  return (
    <div className="wotd">
      <div className="wotd__header">
        <span className="wotd__label-row">
          <Calendar size={14} className="wotd__icon" />
          <span className="wotd__label">Fino' i Ha'åni · Word of the Day</span>
        </span>
        {word.category && (
          <span className="wotd__category">{word.category}</span>
        )}
      </div>
      <div className="wotd__body">
        <div className="wotd__left">
          <div className="wotd__term">
            <h2 className={`wotd__word${hasLongRun(word.chamorro) ? ' wotd__word--long' : ''}`}>
              {withSlashBreaks(word.chamorro)}
            </h2>
            <p className="wotd__english">{word.english}</p>
          </div>
          {isLearned && (
            <p className="wotd__learned"><Check size={14} /> Learned</p>
          )}
          {word.culturalNote && (
            <p className="wotd__note">{word.culturalNote}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default WordOfTheDay
