import { ArrowRight, Check } from 'lucide-react'
import { getCategoryLabel } from '../data/categoryLabels'
import { START_HERE } from '../data/categoryThemes'
import { getCategoryStats, pickContinueCategory } from '../utils/categoryStats'

function CategoryTile({ cat, total, done, onSelectCategory }) {
  const label = getCategoryLabel(cat)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const isComplete = total > 0 && done === total

  return (
    <button
      className={`path-chip ${isComplete ? 'path-chip--complete' : ''}`}
      onClick={() => onSelectCategory(cat)}
      aria-label={`Practice ${label} vocabulary, ${done} of ${total} completed`}
    >
      <span className="path-chip__name">{label}</span>
      <span className="path-chip__meta">
        {isComplete && (
          <Check size={12} className="path-chip__check" aria-hidden="true" />
        )}
        <span className="path-chip__count">{done}/{total}</span>
      </span>
      <span className="path-chip__progress" aria-hidden="true">
        <span
          className="path-chip__progress-fill"
          style={{ width: `${pct}%` }}
        />
      </span>
    </button>
  )
}

// One button for the whole card; RESUME is a styled label inside it.
function ContinueCard({ cat, total, done, onSelectCategory }) {
  const label = getCategoryLabel(cat)
  const pct = Math.round((done / total) * 100)

  return (
    <button
      className="continue-card"
      onClick={() => onSelectCategory(cat)}
      aria-label={`Resume ${label} vocabulary, ${done} of ${total} completed`}
    >
      <span className="continue-card__info">
        <span className="continue-card__eyebrow">Continue</span>
        <span className="continue-card__name">{label}</span>
        <span className="continue-card__count">{done} of {total} words</span>
      </span>
      <span className="continue-card__bar" aria-hidden="true">
        <span className="continue-card__bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="continue-card__resume" aria-hidden="true">Resume</span>
    </button>
  )
}

function LearningPaths({ words, completedIds, onSelectCategory, onBrowseAll }) {
  const stats = getCategoryStats(words, completedIds)
  const categoryCount = Object.keys(stats).length
  const continueCat = pickContinueCategory(stats, completedIds, words)
  const startHere = START_HERE.filter((cat) => stats[cat])

  return (
    <div className="learning-paths">
      <div className="learning-paths__header">
        <span className="learning-paths__label">Start Learning</span>
      </div>

      <div className="learning-paths__body">
        {continueCat && (
          <ContinueCard
            cat={continueCat}
            total={stats[continueCat].total}
            done={stats[continueCat].done}
            onSelectCategory={onSelectCategory}
          />
        )}

        {startHere.length > 0 && (
          <div className="start-here">
            <div className="start-here__header">
              <span className="start-here__label">Start here</span>
              <span className="start-here__hint">Recommended for beginners</span>
            </div>
            <div className="start-here__grid">
              {startHere.map((cat) => (
                <CategoryTile
                  key={cat}
                  cat={cat}
                  total={stats[cat].total}
                  done={stats[cat].done}
                  onSelectCategory={onSelectCategory}
                />
              ))}
            </div>
          </div>
        )}

        <div className="browse-all">
          <button className="browse-all__link" onClick={onBrowseAll}>
            Browse all {categoryCount} categories
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <p className="browse-all__hint">Grouped by theme, with a category finder</p>
        </div>
      </div>
    </div>
  )
}

export default LearningPaths
