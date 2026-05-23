function Header({ totalWords, completedCount }) {
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
          {completedCount} of {totalWords} words completed{' '}
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