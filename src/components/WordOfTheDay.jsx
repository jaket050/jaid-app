import { useEffect } from 'react'
import { Calendar, Check } from 'lucide-react'
import { logEvent } from '../utils/logEvent'

function WordOfTheDay({ words, completedIds }) {
  const verifiedWords = (words ?? []).filter(w => w.verified !== false)

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
        <Calendar size={14} className="wotd__icon" />
        <span className="wotd__label">Fino' i Ha'åni · Word of the Day</span>
      </div>
      <div className="wotd__body">
        <div className="wotd__left">
          {word.category && (
            <span className="wotd__category">{word.category}</span>
          )}
          <h2 className="wotd__word">{word.chamorro}</h2>
          <p className="wotd__english">{word.english}</p>
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
