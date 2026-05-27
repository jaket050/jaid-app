import { useState } from 'react'

function WordCard({ chamorro, english, type, difficulty, culturalNote, isCompleted, onToggle }) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className={`word-card${isCompleted ? " completed" : ""}`}>
      <h2>{chamorro}</h2>
      <p className="word-card__english">{english}</p>
      <div className="word-card__meta">
        <span className="badge">{type}</span>
        <span className="badge">Level {difficulty}</span>
      </div>
      <div className="word-card__actions">
        <button
          className={`btn-complete${isCompleted ? " is-done" : ""}`}
          onClick={onToggle}
          aria-pressed={isCompleted}
        >
          {isCompleted ? "Mark Incomplete" : "Mark Complete"}
        </button>
      </div>
      {culturalNote && (
        <div className="hint-section">
          <button className="btn-hint" onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
          {showHint && <p className="cultural-note">{culturalNote}</p>}
        </div>
      )}
    </div>
  )
}

export default WordCard
