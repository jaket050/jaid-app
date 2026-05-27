function DeckSelect({ words, onSelectDeck, onExit }) {
  const categoryCounts = {}
  words.forEach(word => {
    if (word.category) {
      categoryCounts[word.category] = (categoryCounts[word.category] || 0) + 1
    }
  })

  const categories = Object.entries(categoryCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="deck-select">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">Choose a Deck</span>
      </div>

      <div className="deck-select__content">
        <h2 className="deck-select__title">Choose a Deck</h2>
        <p className="deck-select__subtitle">What do you want to practice?</p>

        <div className="deck-select__grid">
          <button
            className="deck-card deck-card--all"
            onClick={() => onSelectDeck("all")}
          >
            <span className="deck-card__name">All Words</span>
            <span className="deck-card__count">{words.length} words</span>
          </button>

          {categories.map(([cat, count]) => (
            <button
              key={cat}
              className="deck-card"
              onClick={() => onSelectDeck(cat)}
            >
              <span className="deck-card__name">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
              <span className="deck-card__count">
                {count} {count === 1 ? 'word' : 'words'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DeckSelect
