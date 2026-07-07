import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './match.css'

const MODES = [
  {
    slug: 'family',
    label: 'Kinship',
    subtitle: 'Family & relations',
    count: 46,
  },
  {
    slug: 'weather',
    label: 'Weather',
    subtitle: 'Climate & seasons',
    count: 43,
  },
  {
    slug: 'food',
    label: 'Food',
    subtitle: 'CHamoru cuisine',
    count: 37,
  },
  {
    slug: 'antonyms',
    label: 'Antonyms',
    subtitle: 'Opposites match',
    count: null,
  },
  {
    slug: 'map',
    label: 'Municipalities',
    subtitle: 'Place names on the map',
    count: 19,
  },
]

function MatchModeSelect() {
  const [pairCount, setPairCount] = useState(null)

  useEffect(() => {
    supabase
      .from('antonym_pairs')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true)
      .then(({ count }) => { if (count !== null) setPairCount(count) })
  }, [])

  return (
    <div className="match-game">
      <header className="match-game__header">
        <a className="match-game__home" href="/">← Home</a>
        <span className="match-game__brand">JAID</span>
        <span className="match-game__progress">Card Match</span>
      </header>

      <div className="match-mode-select">
        <h2 className="match-mode-select__title">Choose a Mode</h2>
        <p className="match-mode-select__subtitle">
          Match CHamoru words to their English meanings — or find their opposites.
        </p>

        <div className="match-mode-select__grid">
          {MODES.map((m) => (
            <a
              key={m.slug}
              href={`/practice/${m.slug}`}
              className="match-mode-card"
            >
              <span className="match-mode-card__label">{m.label}</span>
              <span className="match-mode-card__subtitle">{m.subtitle}</span>
              <span className="match-mode-card__count">
                {m.slug === 'antonyms'
                  ? (pairCount !== null ? `${pairCount} pairs` : '…')
                  : m.slug === 'map'
                  ? '19 places'
                  : `${m.count} words`}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MatchModeSelect
