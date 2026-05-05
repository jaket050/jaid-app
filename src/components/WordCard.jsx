import { useState } from 'react'

function WordCard({ chamorro, english, type, difficulty, culturalNote, isCompleted, onToggle }) {
  const [hint, setHint] = useState(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const getHint = async () => {
    setLoadingHint(true)
    try {
      const response = await fetch('https://jaid-server-production.up.railway.app/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamorro, english, culturalNote })
      })
      const data = await response.json()
      setHint(data.hint)
    } catch {
      setHint("Could not load hint. Please try again.")
    } finally {
      setLoadingHint(false)
    }
  }

  return (
    <div className={`word-card${isCompleted ? " completed" : ""}`}>
      <h2>{chamorro}</h2>
      <p className="word-card__english">{english}</p>
      <div className="word-card__meta">
        <span className="badge">{type}</span>
        <span className="badge">Level {difficulty}</span>
      </div>
      {culturalNote !== "" && <p className="cultural-note">{culturalNote}</p>}
      {hint && <p className="hint">{hint}</p>}
      <div className="word-card__actions">
        <button
          className={`btn-complete${isCompleted ? " is-done" : ""}`}
          onClick={onToggle}
          aria-pressed={isCompleted}
        >
          {isCompleted ? "Mark Incomplete" : "Mark Complete"}
        </button>
        <button
          className="btn-hint"
          onClick={getHint}
          disabled={loadingHint}
        >
          {loadingHint ? "Getting hint..." : hint ? "New Tip" : "Memory Tip"}
        </button>
      </div>
    </div>
  )
}

export default WordCard
