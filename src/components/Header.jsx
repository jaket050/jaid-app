import { useState, useEffect, useRef } from 'react'

// Animate a number upward over `duration` ms; jump instantly on any decrease.
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = target
    let rafId
    if (target <= from) {
      // Decrease (or no change): jump instantly, deferred a frame so this is
      // not a synchronous setState in the effect body.
      rafId = requestAnimationFrame(() => setDisplay(target))
      return () => cancelAnimationFrame(rafId)
    }
    let startTs = null
    const tick = (ts) => {
      if (startTs === null) startTs = ts
      const p = Math.min((ts - startTs) / duration, 1)
      setDisplay(Math.round(from + (target - from) * p))
      if (p < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return display
}

function Header({ totalWords, completedCount, hasPracticedToday, streakCount }) {
  const animatedCount = useCountUp(completedCount)
  const percentage = totalWords > 0
    ? Math.round((completedCount / totalWords) * 100)
    : 0

  return (
    <div className="hero-section">
      <div className="hero-image-wrapper">
        <img src="/tumon-bay.jpg" alt="Tumon Bay, Guam" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-title-block">
          <p className="hero-eyebrow">Guåhan · CHamoru Language Learning</p>
          <h1>JAID</h1>
          <h2 className="header-subtitle">Joining Ancestors In Dialogue</h2>
          <p className="hero-tagline">Preserving the language of Guåhan</p>
        </div>
        <span className="photo-credit">Photo: Sung Jin Cho / Unsplash</span>
      </div>
      <div className="hero-content">
        <p className="progress">
          <span className="progress__count">{animatedCount}</span>{' '}
          <span className="progress__muted">of</span>{' '}
          <span className="progress__total">{totalWords}</span>{' '}
          <span className="progress__muted">words completed</span>{' '}
          {hasPracticedToday && (
            <>
              <span className="practice-dot" aria-label="Practiced today">●</span>
              {streakCount > 0 && (
                <span className="hero-streak">Day {streakCount}</span>
              )}
            </>
          )}
          <span className="counter">{percentage}%</span>
        </p>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  )
}

export default Header
