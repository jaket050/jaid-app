import { useState } from 'react'
import FlashCard from './FlashCard'

const LEARNING_PATH_ORDER = [
  'Greetings', 'Family', 'Values', 'Holidays and Religion', 'Baptism',
  'Food', 'Drinks', 'Body Parts', 'Home', 'School', 'Animals', 'Plants',
  'Water', 'Weather', 'Land', 'Places', 'Numbers', 'Colors', 'Shapes',
  'Days of the Week', 'Months of the Year', 'Time', 'Money', 'Genealogy',
  'Pronouns', 'Verbs', 'Adjectives', 'Directions', 'Objects', 'Emotions',
  'Nature', 'People', 'Questions', 'Culture',
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Difficulty ascending; shuffle within each difficulty group.
function orderByDifficulty(words) {
  const groups = {}
  words.forEach(w => {
    const d = w.difficulty ?? 0
    ;(groups[d] = groups[d] || []).push(w)
  })
  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap(d => shuffle(groups[d]))
}

function nextCategory(category) {
  const idx = LEARNING_PATH_ORDER.indexOf(category)
  if (idx === -1 || idx === LEARNING_PATH_ORDER.length - 1) return 'Greetings'
  return LEARNING_PATH_ORDER[idx + 1]
}

function StudyMode({ words, completedIds, toggleId, totalWords, category, onSelectDeck, onExit }) {
  const [queue, setQueue] = useState(() => orderByDifficulty(words))
  const [revealed, setRevealed] = useState(false)
  const [gotItIds, setGotItIds] = useState(() => new Set())

  if (queue.length === 0) {
    const suggestion = nextCategory(category)
    return (
      <div className="study-summary">
        <div className="study-summary__phrase">
          <h2 className="study-summary__chamorro">Si Yu'os Ma'åse'</h2>
          <p className="study-summary__english">Thank you</p>
        </div>
        <div className="study-summary__stats">
          <div className="study-summary__stat">
            <span className="study-summary__num">{gotItIds.size}</span>
            <span className="study-summary__label">words practiced</span>
          </div>
          <div className="study-summary__stat">
            <span className="study-summary__num">{completedIds.size}</span>
            <span className="study-summary__label">of {totalWords} total</span>
          </div>
        </div>
        <button className="btn-back-to-browse" onClick={onExit}>Back to browse</button>
        {onSelectDeck && (
          <button className="btn-next-deck" onClick={() => onSelectDeck(suggestion)}>
            Try next: {suggestion}
          </button>
        )}
      </div>
    )
  }

  const card = queue[0]

  const handleGotIt = () => {
    if (!completedIds.has(card.id)) toggleId(card.id)
    setGotItIds(prev => new Set(prev).add(card.id))
    setQueue(prev => prev.slice(1))
    setRevealed(false)
  }

  const handlePracticeMore = () => {
    setQueue(prev => [...prev.slice(1), prev[0]])
    setRevealed(false)
  }

  return (
    <div className="study-mode">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>
          {category && category !== 'all' ? `← Back to ${category}` : '← Home'}
        </button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">
          <span className="study-mode__stat-learned">{gotItIds.size} learned</span>
          {' · '}
          <span className="study-mode__stat-remaining">{queue.length} to go</span>
        </span>
      </div>
      <div className="study-mode__card-area">
        <FlashCard
          key={`${card.id}-${queue.length}`}
          chamorro={card.chamorro}
          english={card.english}
          category={card.category}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGotIt={handleGotIt}
          onPracticeMore={handlePracticeMore}
        />
      </div>
    </div>
  )
}

export default StudyMode
