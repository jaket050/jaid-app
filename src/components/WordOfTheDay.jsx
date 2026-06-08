import { Calendar } from 'lucide-react'

function WordOfTheDay({ words }) {
  if (!words || words.length === 0) return null

  const verifiedWords = words.filter(w => w.verified !== false)
  if (verifiedWords.length === 0) return null

  const start = new Date('2026-01-01')
  const today = new Date()
  const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const word = verifiedWords[dayIndex % verifiedWords.length]

  return (
    <div className="wotd">
      <div className="wotd__header">
        <Calendar size={14} className="wotd__icon" />
        <span className="wotd__label">Fino' i Ha'åni · Word of the Day</span>
      </div>
      <div className="wotd__body">
        <div className="wotd__left">
          <h2 className="wotd__word">{word.chamorro}</h2>
          <p className="wotd__english">{word.english}</p>
          {word.culturalNote && (
            <p className="wotd__note">{word.culturalNote}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default WordOfTheDay
