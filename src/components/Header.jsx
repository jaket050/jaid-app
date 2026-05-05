import { useState } from 'react'

function Header({ totalWords, completedCount }) {
  const [suggestion, setSuggestion] = useState(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const percentage = totalWords > 0
    ? Math.round((completedCount / totalWords) * 100)
    : 0

  const getSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const response = await fetch('http://jaid-server-production.up.railway.app/api/study-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedCount,
          totalCount: totalWords
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
    <div className="hero-section">
      <div className="hero-image-wrapper">
        <img src="/tumon-bay.jpg" alt="Tumon Bay, Guam" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-title-block">
          <h1>JAID</h1>
          <h2 className="header-subtitle">Joining Ancestors In Dialogue</h2>
        </div>
        <span className="photo-credit">Photo: Sung Jin Cho / Unsplash</span>
      </div>
      <div className="hero-content">
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
    </div>
  )
}

export default Header