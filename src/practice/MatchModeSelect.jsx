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
]

function MatchModeSelect() {
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
                {m.count !== null ? `${m.count} words` : 'Coming soon'}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MatchModeSelect
