import { useState } from 'react'
import FlashCard from './FlashCard'

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function StudyMode({ words, completedIds, toggleId, onExit }) {
  const [queue, setQueue] = useState(() => shuffle(words))
  const [revealed, setRevealed] = useState(false)
  const [gotItIds, setGotItIds] = useState(() => new Set())
  const [practiceCount, setPracticeCount] = useState(0)

  if (queue.length === 0) {
    return (
      <div className="study-summary">
        <h2 className="study-summary__title">Session complete</h2>
        <p className="study-summary__stat">
          <span className="study-summary__num">{gotItIds.size}</span> words learned
        </p>
        <p className="study-summary__stat">
          <span className="study-summary__num">{practiceCount}</span> to practice more
        </p>
        <button className="btn-back-to-browse" onClick={onExit}>Back to browse</button>
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
    setPracticeCount(c => c + 1)
    setQueue(prev => [...prev.slice(1), prev[0]])
    setRevealed(false)
  }

  return (
    <div className="study-mode">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">{gotItIds.size} learned · {queue.length} to go</span>
      </div>
      <div className="study-mode__card-area">
        <FlashCard
          key={`${card.id}-${queue.length}`}
          chamorro={card.chamorro}
          english={card.english}
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
