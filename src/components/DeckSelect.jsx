import { useState, useSyncExternalStore } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { getCategoryLabel } from '../data/categoryLabels'
import { groupByTheme } from '../data/categoryThemes'
import { normalizeChamorro } from '../utils/normalize'

// The deck picker before Practice and before a quiz. Categories are grouped
// by the same themes as the All Categories library (groupByTheme), with a
// finder. Phones get collapsible themes, at the library's breakpoint.
const PHONE_QUERY = '(max-width: 480px)'

function subscribePhone(onChange) {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  )
}

const wordCount = (n) => `${n} ${n === 1 ? 'word' : 'words'}`

// A deck with fewer than minWords words stays visible but is plain text,
// not a button: readable by screen readers and skipped by Tab.
function DeckRow({ cat, count, minWords, onSelectDeck }) {
  const label = getCategoryLabel(cat)
  if (count < minWords) {
    return (
      <li>
        <div className="deck-row deck-row--locked">
          <span className="deck-row__name">{label}</span>
          <span className="deck-row__count">Needs at least {minWords} words</span>
        </div>
      </li>
    )
  }
  return (
    <li>
      <button type="button" className="deck-row" onClick={() => onSelectDeck(cat)}>
        <span className="deck-row__name">{label}</span>
        <span className="deck-row__count">{wordCount(count)}</span>
      </button>
    </li>
  )
}

function DeckSelect({ words, onSelectDeck, onExit, minWords = 0, subtitle = 'What do you want to practice?' }) {
  const stats = {}
  words.forEach((word) => {
    if (word.category) stats[word.category] = { total: (stats[word.category]?.total ?? 0) + 1 }
  })
  const themes = groupByTheme(stats)
  const isPhone = useIsPhone()
  const [query, setQuery] = useState('')
  // On phones the first theme starts open; the rest are collapsed.
  const [openThemes, setOpenThemes] = useState(() => new Set(themes[0] ? [themes[0].name] : []))

  const needle = normalizeChamorro(query.trim())
  const visibleThemes = themes
    .map((t) => ({
      ...t,
      categories: needle === ''
        ? t.categories
        : t.categories.filter((cat) => normalizeChamorro(getCategoryLabel(cat)).includes(needle)),
    }))
    .filter((t) => t.categories.length > 0)

  const toggleTheme = (name) => {
    setOpenThemes((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="deck-select">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress" aria-hidden="true" />
      </div>

      <div className="deck-select__content">
        <h1 className="deck-select__title">Choose a Deck</h1>
        <p className="deck-select__subtitle">{subtitle}</p>

        <button type="button" className="deck-all" onClick={() => onSelectDeck('all')}>
          <span className="deck-all__name">All Words</span>
          <span className="deck-all__count">{words.length} words</span>
        </button>

        <div className="deck-finder">
          <label htmlFor="deck-finder-input" className="deck-finder__label">
            Find a category
          </label>
          <div className="deck-finder__row">
            <Search size={14} className="deck-finder__icon" aria-hidden="true" />
            <input
              id="deck-finder-input"
              className="deck-finder__input"
              type="search"
              placeholder="Type a category name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {visibleThemes.length === 0 ? (
          <p className="deck-select__empty" role="status">
            No categories match "{query.trim()}".
          </p>
        ) : (
          <div className="deck-themes">
            {visibleThemes.map((theme) => {
              const listId = `deck-theme-${theme.name.replace(/\s+/g, '_')}`
              const expanded = !isPhone || needle !== '' || openThemes.has(theme.name)
              return (
                <section key={theme.name} className="deck-theme">
                  {isPhone ? (
                    <h2 className="deck-theme__heading">
                      <button
                        type="button"
                        className="deck-theme__toggle"
                        aria-expanded={expanded}
                        aria-controls={listId}
                        onClick={() => toggleTheme(theme.name)}
                      >
                        <span className="deck-theme__name">{theme.name}</span>
                        <span className="deck-theme__count">
                          {theme.categories.length} {theme.categories.length === 1 ? 'category' : 'categories'}
                        </span>
                        <ChevronDown size={16} className="deck-theme__chevron" aria-hidden="true" />
                      </button>
                    </h2>
                  ) : (
                    <h2 className="deck-theme__heading deck-theme__title">{theme.name}</h2>
                  )}
                  <ul id={listId} className="deck-theme__list" hidden={!expanded}>
                    {theme.categories.map((cat) => (
                      <DeckRow
                        key={cat}
                        cat={cat}
                        count={stats[cat].total}
                        minWords={minWords}
                        onSelectDeck={onSelectDeck}
                      />
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeckSelect
