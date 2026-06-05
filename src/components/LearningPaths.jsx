import {
  MessageCircle, Users, UtensilsCrossed, Hash, Calendar,
  CalendarDays, Heart, Leaf, Package, MapPin, Compass,
  Zap, User, Sparkles, Star, Clock, Gift, HelpCircle,
  Fingerprint, UserCircle
} from 'lucide-react'

const CATEGORY_CONFIG = {
  greetings: { icon: MessageCircle, label: 'Greetings', color: '#2d6a4f' },
  family: { icon: Users, label: 'Family', color: '#1a3a5c' },
  food: { icon: UtensilsCrossed, label: 'Food', color: '#8b4513' },
  numbers: { icon: Hash, label: 'Numbers', color: '#1a3a5c' },
  days: { icon: Calendar, label: 'Days', color: '#2d6a4f' },
  months: { icon: CalendarDays, label: 'Months', color: '#2d6a4f' },
  emotions: { icon: Heart, label: 'Emotions', color: '#8b2020' },
  nature: { icon: Leaf, label: 'Nature', color: '#2d6a4f' },
  objects: { icon: Package, label: 'Objects', color: '#718096' },
  places: { icon: MapPin, label: 'Places', color: '#1a3a5c' },
  directions: { icon: Compass, label: 'Directions', color: '#1a3a5c' },
  verbs: { icon: Zap, label: 'Verbs', color: '#c9a84c' },
  pronouns: { icon: User, label: 'Pronouns', color: '#1a3a5c' },
  adjectives: { icon: Sparkles, label: 'Adjectives', color: '#c9a84c' },
  values: { icon: Star, label: 'Values', color: '#c9a84c' },
  time: { icon: Clock, label: 'Time', color: '#1a3a5c' },
  holidays: { icon: Gift, label: 'Holidays', color: '#8b2020' },
  questions: { icon: HelpCircle, label: 'Questions', color: '#718096' },
  identity: { icon: Fingerprint, label: 'Identity', color: '#718096' },
  people: { icon: UserCircle, label: 'People', color: '#1a3a5c' },
}

function LearningPaths({ words, onSelectCategory }) {
  const categoryCounts = {}
  words.forEach(word => {
    if (word.category) {
      categoryCounts[word.category] = (categoryCounts[word.category] || 0) + 1
    }
  })

  const categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])

  const startCategory = categories.find(([cat]) => cat === 'greetings')
    || categories[0]

  return (
    <div className="learning-paths">
      <div className="learning-paths__header">
        <span className="learning-paths__label">Start Learning</span>
      </div>
      <div className="learning-paths__grid">
        {categories.map(([cat, count]) => {
          const config = CATEGORY_CONFIG[cat] || {
            icon: Hash,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            color: '#718096'
          }
          const IconComponent = config.icon
          const isStart = startCategory && startCategory[0] === cat

          return (
            <button
              key={cat}
              className={`path-card ${isStart ? 'path-card--start' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              <div
                className="path-card__icon"
                style={{ background: `${config.color}18`, color: config.color }}
              >
                <IconComponent size={20} />
              </div>
              <span className="path-card__name">{config.label}</span>
              <span className="path-card__count">
                {count} {count === 1 ? 'word' : 'words'}
              </span>
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
