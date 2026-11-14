import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, Check, ChevronDown, Search } from 'lucide-react'
import { getCategoryLabel } from '../data/categoryLabels'
import { groupByTheme } from '../data/categoryThemes'
import { getCategoryStats, pickContinueCategory } from '../utils/categoryStats'
import { normalizeChamorro } from '../utils/normalize'

// Phones get collapsible themes. Subscribing to the media query keeps this in
// step with window resizes and rotation, not just the width at first load.
const PHONE_QUERY = '(max-width: 480px)'

function subscribePhone(onChange) {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsPhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches)
}

function CategoryRow({ cat, total, done, onSelectCategory }) {
  const label = getCategoryLabel(cat)
  const isComplete = total > 0 && done === total
  const isInProgress = done > 0 && !isComplete

  return (
    <li>
      <button
        className={`library-row ${isInProgress ? 'library-row--progress' : ''} ${isComplete ? 'library-row--complete' : ''}`}
        onClick={() => onSelectCategory(cat)}
        aria-label={`Practice ${label} vocabulary, ${done} of ${total} completed`}
      >
        <span className="library-row__name">{label}</span>
        <span className="library-row__meta">
          {isComplete && (
            <Check size={12} className="library-row__check" aria-hidden="true" />
          )}
          <span className="library-row__count">{done}/{total}</span>
        </span>
      </button>
    </li>
  )
}

function CategoryLibrary({ words, completedIds, onSelectCategory, onExit }) {
  const stats = getCategoryStats(words, completedIds)
  const categoryCount = Object.keys(stats).length
  const themes = groupByTheme(stats)
  const isPhone = useIsPhone()
  const [query, setQuery] = useState('')
  // Collapsed by default, except the theme holding the Continue category.
  const [openThemes, setOpenThemes] = useState(() => {
    const continueCat = pickContinueCategory(stats, completedIds, words)
    const home = themes.find((t) => t.categories.includes(continueCat))
    return new Set(home ? [home.name] : [])
  })

  // The library is reached from the bottom of home; open it at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
    <div className="library">
      <div className="library__inner">
        <button className="library__home" onClick={onExit}>
          <ArrowLeft size={14} aria-hidden="true" />
          Home
        </button>

        <div className="library__top">
          <div className="library__heading">
            <h1 className="library__title">All Categories</h1>
            <p className="library__subtitle">{categoryCount} categories, grouped by theme</p>
          </div>
          <div className="library-finder">
            <label htmlFor="library-finder-input" className="library-finder__label">
              Find a category
            </label>
            <div className="library-finder__row">
              <Search size={14} className="library-finder__icon" aria-hidden="true" />
              <input
                id="library-finder-input"
                className="library-finder__input"
                type="search"
                placeholder="Type a category name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {visibleThemes.length === 0 ? (
          <p className="library__empty" role="status">
            No categories match "{query.trim()}".
          </p>
        ) : (
          <div className="library__themes">
            {visibleThemes.map((theme) => {
              const listId = `library-theme-${theme.name.replace(/\s+/g, '_')}`
              const expanded = !isPhone || needle !== '' || openThemes.has(theme.name)
              const rows = theme.categories.map((cat) => (
                <CategoryRow
                  key={cat}
                  cat={cat}
                  total={stats[cat].total}
                  done={stats[cat].done}
                  onSelectCategory={onSelectCategory}
                />
              ))

              return (
                <section key={theme.name} className="library-theme">
                  {isPhone ? (
                    <h2 className="library-theme__heading">
                      <button
                        className="library-theme__toggle"
                        aria-expanded={expanded}
                        aria-controls={listId}
                        onClick={() => toggleTheme(theme.name)}
                      >
                        <span className="library-theme__name">{theme.name}</span>
                        <span className="library-theme__count">
                          {theme.categories.length} {theme.categories.length === 1 ? 'category' : 'categories'}
                        </span>
                        <ChevronDown size={16} className="library-theme__chevron" aria-hidden="true" />
                      </button>
                    </h2>
                  ) : (
                    <h2 className="library-theme__heading library-theme__title">{theme.name}</h2>
                  )}
                  <ul id={listId} className="library-theme__list" hidden={!expanded}>
                    {rows}
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

export default CategoryLibrary
