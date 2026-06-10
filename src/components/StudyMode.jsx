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

function StudyMode({ words, completedIds, toggleId, totalWords, onExit }) {
  const [queue, setQueue] = useState(() => shuffle(words))
  const [revealed, setRevealed] = useState(false)
  const [gotItIds, setGotItIds] = useState(() => new Set())

  if (queue.length === 0) {
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
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">{gotItIds.size} learned · {queue.length} to go</span>
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
