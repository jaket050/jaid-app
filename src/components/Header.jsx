import { useState } from 'react'

function Header({ totalWords, completedCount, words, completedIds }) {
  const [suggestion, setSuggestion] = useState(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const percentage = totalWords > 0
    ? Math.round((completedCount / totalWords) * 100)
    : 0

  const getSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const completedDifficulty1 = words.filter(w => w.difficulty === 1 && completedIds.has(w.id)).length
      const completedDifficulty2 = words.filter(w => w.difficulty === 2 && completedIds.has(w.id)).length

      const response = await fetch('http://localhost:3001/api/study-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedCount,
          totalCount: totalWords,
          completedDifficulty1,
          completedDifficulty2
        })
      })
      const data = await response.json()
      setSuggestion(data.suggestion)
    } catch {
      setSuggestion("Could not load suggestion. Please try again.")
    } finally {
      setLoadingSuggestion(false)
    }
  }

  return (
    <div className="app-header">
      <h1>JAID</h1>
      <h2 className="header-subtitle">Joining Ancestors In Dialogue</h2>
      <p>Chamorro Language Learning</p>
      <p className="progress">
        {completedCount} of {totalWords} words completed{' '}
        <span className="counter">{percentage}%</span>
      </p>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${percentage}%` }} />
      </div>
      <button
        className="btn-suggestion"
        onClick={getSuggestion}
        disabled={loadingSuggestion}
      >
        {loadingSuggestion ? "Thinking..." : suggestion ? "New Suggestion" : "Get Study Suggestion"}
      </button>
      {suggestion && <p className="suggestion">{suggestion}</p>}
    </div>
  )
}

export default Header