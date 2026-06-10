function FlashCard({ chamorro, english, category, revealed, onReveal, onGotIt, onPracticeMore }) {
  return (
    <div
      className={`flashcard${revealed ? ' is-revealed' : ''}`}
      onClick={!revealed ? onReveal : undefined}
      role={!revealed ? 'button' : undefined}
      tabIndex={!revealed ? 0 : undefined}
      onKeyDown={!revealed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReveal() } } : undefined}
    >
      <p className="flashcard__chamorro">{chamorro}</p>
      {revealed ? (
        <>
          <p className="flashcard__english">{english}</p>
          {category && <span className="flashcard__category">{category}</span>}
          <div className="flashcard__actions">
            <button className="btn-got-it" onClick={onGotIt}>Got it</button>
            <button className="btn-practice" onClick={onPracticeMore}>Practice more</button>
          </div>
        </>
      ) : (
        <p className="flashcard__hint">Tap to reveal</p>
      )}
    </div>
  )
}

export default FlashCard
