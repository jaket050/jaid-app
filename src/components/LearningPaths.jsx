import { Check } from 'lucide-react'

const CATEGORY_CONFIG = {
  'Adjectives':            { label: 'Adjectives' },
  'Anatomy':               { label: 'Anatomy' },
  'Animals':               { label: 'Animals' },
  'Baptism':               { label: 'Baptism' },
  'Colors':                { label: 'Colors' },
  'Culture':               { label: 'Culture' },
  'Days of the Week':      { label: 'Days of the Week' },
  'Directions':            { label: 'Directions' },
  'Drinks':                { label: 'Drinks' },
  'Emotions':              { label: 'Emotions' },
  'Family':                { label: 'Family' },
  'Food':                  { label: 'Food' },
  'Genealogy':             { label: 'Genealogy' },
  'Government':            { label: 'Government' },
  'Greetings':             { label: 'Greetings' },
  'Holidays and Religion': { label: 'Holidays and Religion' },
  'Home':                  { label: 'Home' },
  'Islands':               { label: 'Islands' },
  'Land':                  { label: 'Land' },
  'Legal':                 { label: 'Legal' },
  'Money':                 { label: 'Money' },
  'Months of the Year':    { label: 'Months of the Year' },
  'Nature':                { label: 'Nature' },
  'Numbers Ansiånu':       { label: 'Numbers Ansiånu' },
  'Numbers Prisente':      { label: 'Numbers Prisente' },
  'Objects':               { label: 'Objects' },
  'People':                { label: 'People' },
  'Places':                { label: 'Places' },
  'Plants':                { label: 'Plants' },
  'Pronouns':              { label: 'Pronouns' },
  'Questions':             { label: 'Questions' },
  'School':                { label: 'School' },
  'Self Determination':    { label: 'Self Determination' },
  'Shapes':                { label: 'Shapes' },
  'Technology':            { label: 'Technology' },
  'Time':                  { label: 'Time' },
  'Values':                { label: 'Values' },
  'Verbs':                 { label: 'Verbs' },
  'Water':                 { label: 'Water' },
  'Weather':               { label: 'Weather' },
  'Years and Centuries':   { label: 'Years and Centuries' },
}

const DEFAULT_CONFIG = { label: '' }

function LearningPaths({ words, completedIds, onSelectCategory }) {
  const stats = {}
  words.forEach((w) => {
    if (!w.category) return
    if (!stats[w.category]) stats[w.category] = { total: 0, done: 0 }
    stats[w.category].total++
    if (completedIds && completedIds.has(w.id)) stats[w.category].done++
  })

  // Greetings is pinned first; everything else stays largest deck first.
  const categories = Object.entries(stats).sort((a, b) => {
    if (a[0] === 'Greetings') return -1
    if (b[0] === 'Greetings') return 1
    return b[1].total - a[1].total
  })

  return (
    <div className="learning-paths">
      <div className="learning-paths__header">
        <span className="learning-paths__label">Start Learning</span>
      </div>
      <div className="learning-paths__grid">
        {categories.map(([cat, { total, done }]) => {
          const config = CATEGORY_CONFIG[cat] || {
            ...DEFAULT_CONFIG,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
          }
          const isStart = cat === 'Greetings'
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const isComplete = total > 0 && done === total

          return (
            <button
              key={cat}
              className={`path-chip ${isStart ? 'path-chip--start' : ''} ${isComplete ? 'path-chip--complete' : ''}`}
              onClick={() => onSelectCategory(cat)}
              aria-label={`Practice ${config.label} vocabulary, ${done} of ${total} completed`}
            >
              <span className="path-chip__name">{config.label}</span>
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
        })}
      </div>
    </div>
  )
}

export default LearningPaths
