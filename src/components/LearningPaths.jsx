import {
  MessageCircle, Users, Utensils, Hash, Calendar,
  CalendarDays, Heart, Leaf, Box, MapPin, Compass,
  Zap, User, Palette, Star, Clock, Church, HelpCircle,
  UsersRound, CloudSun, TreeDeciduous, Droplets,
  Landmark, BookOpen, Check, Waves, Mountain, GraduationCap,
  PawPrint, Flower2, Stethoscope, House, Pipette, Shapes,
  Coffee, Banknote
} from 'lucide-react'

const CATEGORY_CONFIG = {
  'Adjectives':            { icon: Palette,       label: 'Adjectives' },
  'Animals':               { icon: PawPrint,      label: 'Animals' },
  'Baptism':               { icon: Droplets,      label: 'Baptism' },
  'Body Parts':            { icon: Stethoscope,   label: 'Body Parts' },
  'Colors':                { icon: Pipette,       label: 'Colors' },
  'Culture':               { icon: Landmark,      label: 'Culture' },
  'Days of the Week':      { icon: CalendarDays,  label: 'Days of the Week' },
  'Directions':            { icon: Compass,       label: 'Directions' },
  'Drinks':                { icon: Coffee,        label: 'Drinks' },
  'Emotions':              { icon: Heart,         label: 'Emotions' },
  'Family':                { icon: Users,         label: 'Family' },
  'Food':                  { icon: Utensils,      label: 'Food' },
  'Genealogy':             { icon: TreeDeciduous, label: 'Genealogy' },
  'Greetings':             { icon: MessageCircle, label: 'Greetings' },
  'Holidays and Religion': { icon: Church,        label: 'Holidays and Religion' },
  'Home':                  { icon: House,         label: 'Home' },
  'Land':                  { icon: Mountain,      label: 'Land' },
  'Money':                 { icon: Banknote,      label: 'Money' },
  'Months of the Year':    { icon: Calendar,      label: 'Months of the Year' },
  'Nature':                { icon: Leaf,          label: 'Nature' },
  'Numbers':               { icon: Hash,          label: 'Numbers' },
  'Objects':               { icon: Box,           label: 'Objects' },
  'People':                { icon: UsersRound,    label: 'People' },
  'Places':                { icon: MapPin,        label: 'Places' },
  'Plants':                { icon: Flower2,       label: 'Plants' },
  'Pronouns':              { icon: User,          label: 'Pronouns' },
  'Questions':             { icon: HelpCircle,    label: 'Questions' },
  'School':                { icon: GraduationCap, label: 'School' },
  'Shapes':                { icon: Shapes,        label: 'Shapes' },
  'Time':                  { icon: Clock,         label: 'Time' },
  'Values':                { icon: Star,          label: 'Values' },
  'Verbs':                 { icon: Zap,           label: 'Verbs' },
  'Water':                 { icon: Waves,         label: 'Water' },
  'Weather':               { icon: CloudSun,      label: 'Weather' },
}

const DEFAULT_CONFIG = { icon: BookOpen, label: '' }

function LearningPaths({ words, completedIds, onSelectCategory }) {
  const stats = {}
  words.forEach((w) => {
    if (!w.category) return
    if (!stats[w.category]) stats[w.category] = { total: 0, done: 0 }
    stats[w.category].total++
    if (completedIds && completedIds.has(w.id)) stats[w.category].done++
  })

  const categories = Object.entries(stats).sort((a, b) => b[1].total - a[1].total)

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
          const IconComponent = config.icon
          const isStart = cat === 'Greetings'
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const isComplete = total > 0 && done === total
          const isEmpty = total > 0 && done === 0

          return (
            <button
              key={cat}
              className={`path-card ${isStart ? 'path-card--start' : ''} ${isComplete ? 'path-card--complete' : ''}`}
              onClick={() => onSelectCategory(cat)}
              aria-label={`Practice ${config.label} vocabulary, ${done} of ${total} completed`}
            >
              {isComplete && (
                <span className="path-card__complete-check"><Check size={14} /></span>
              )}
              <div className="path-card__icon">
                <IconComponent size={20} />
              </div>
              <span className="path-card__name">{config.label}</span>
              <span className="path-card__count">{done} of {total}</span>
              <div
                className="path-card__progress"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="path-card__progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {isEmpty && !isStart && (
                <span className="path-card__hint">Tap to begin</span>
              )}
              {isStart && (
                <span className="path-card__badge">Start here</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LearningPaths
