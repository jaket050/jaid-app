import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './match.css'

const MODES = [
  {
    slug: 'family',
    label: 'Kinship',
    subtitle: 'Family & relations',
    category: 'family',
  },
  {
    slug: 'weather',
    label: 'Weather',
    subtitle: 'Climate & seasons',
    category: 'weather',
  },
  {
    slug: 'food',
    label: 'Food',
    subtitle: 'CHamoru cuisine',
    category: 'food',
  },
  {
    slug: 'antonyms',
    label: 'Antonyms',
    subtitle: 'Opposites match',
  },
  {
    slug: 'map',
    label: 'Municipalities',
    subtitle: 'Place names on the map',
    count: 19,
  },
  {
    slug: 'anatomy',
    label: 'Anatomy',
    subtitle: 'Body parts on the figure',
    count: 22,
  },
  {
    slug: 'days',
    label: 'Days',
    subtitle: 'Order the week',
    count: 7,
    unit: 'days',
  },
  {
    slug: 'months',
    label: 'Months',
    subtitle: 'Build the year',
    count: 12,
    unit: 'months',
  },
]

// Kinship, Weather and Food show how many verified words the game will deal,
// counted with the same filter as MatchGame.fetchVocab (category, case
// insensitive, verified only). Antonyms counts verified pairs whose words are
// both verified. Municipalities and Anatomy are fixed game assets: 19 places
// (municipalityGameNames.js) and 22 parts (anatomyGameSpots.js). Days and
// Months show 7 days and 12 months, the length of a week and a year, not
// vocabulary counts.
function MatchModeSelect() {
  const [pairCount, setPairCount] = useState(null)
  const [wordCounts, setWordCounts] = useState({})

  useEffect(() => {
    for (const { category } of MODES.filter((m) => m.category)) {
      supabase
        .from('vocabulary')
        .select('id', { count: 'exact', head: true })
        .ilike('category', category)
        .eq('verified', true)
        .then(({ count }) => {
          if (count !== null) setWordCounts((prev) => ({ ...prev, [category]: count }))
        })
    }
  }, [])

  useEffect(() => {
    supabase
      .from('antonym_pairs')
      .select(
        'id, word_a:vocabulary!antonym_pairs_word_a_id_fkey!inner(id), word_b:vocabulary!antonym_pairs_word_b_id_fkey!inner(id)',
        { count: 'exact', head: true }
      )
      .eq('verified', true)
      .eq('word_a.verified', true)
      .eq('word_b.verified', true)
      .then(({ count }) => { if (count !== null) setPairCount(count) })
  }, [])

  return (
    <div className="match-game">
      <header className="match-game__header">
        <a className="match-game__home" href="/">← Home</a>
        <span className="match-game__brand">JAID</span>
        <span className="match-game__progress">Games</span>
      </header>

      <div className="match-mode-select">
        <h2 className="match-mode-select__title">Games</h2>
        <p className="match-mode-select__subtitle">
          Practice through matching, placing, and ordering.
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
                  : m.category
                  ? (wordCounts[m.category] != null ? `${wordCounts[m.category]} words` : '…')
                  : m.slug === 'map'
                  ? '19 places'
                  : m.unit
                  ? `${m.count} ${m.unit}`
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
