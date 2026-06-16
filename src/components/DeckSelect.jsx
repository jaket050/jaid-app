function DeckSelect({ words, category, onSelectDeck, onExit, minWords = 0, subtitle = 'What do you want to practice?' }) {
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
        <button className="btn-exit-study" onClick={onExit}>
          {category && category !== 'all' ? `← Back to ${category}` : '← Home'}
        </button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">Choose a Deck</span>
      </div>

      <div className="deck-select__content">
        <h2 className="deck-select__title">Choose a Deck</h2>
        <p className="deck-select__subtitle">{subtitle}</p>

        <div className="deck-select__grid">
          <button
            className="deck-card deck-card--all"
            onClick={() => onSelectDeck("all")}
          >
            <span className="deck-card__name">All Words</span>
            <span className="deck-card__count">{words.length} words</span>
          </button>

          {categories.map(([cat, count]) => {
            const locked = count < minWords
            return (
              <button
                key={cat}
                className="deck-card"
                onClick={() => onSelectDeck(cat)}
                disabled={locked}
              >
                <span className="deck-card__name">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
                <span className="deck-card__count">
                  {locked
                    ? `Need ${minWords}+ words`
                    : `${count} ${count === 1 ? 'word' : 'words'}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DeckSelect
