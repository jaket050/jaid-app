function WordCard({ chamorro, english, type, difficulty, isCompleted, onToggle, onPractice }) {
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
        {onPractice && (
          <button className="btn-practice-word" onClick={onPractice}>
            Practice
          </button>
        )}
      </div>
    </div>
  )
}

export default WordCard
