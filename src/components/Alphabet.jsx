import { chamorroAlphabet, vowels, pronunciationNotes } from '../data/alphabet'

function Alphabet({ onExit }) {
  return (
    <div className="alphabet-page">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">I Atfabetu</span>
      </div>

      <div className="alphabet-content">
        <div className="alphabet-intro">
          <h2 className="alphabet-intro__title">I Atfabetu</h2>
          <p className="alphabet-intro__sub">The CHamoru Alphabet</p>
          <p className="alphabet-intro__meta">24 letters · 6 vowels · 18 consonants</p>
        </div>

        <div className="alphabet-grid">
          {chamorroAlphabet.map((item) => (
            <div
              key={item.letter}
              className={`alphabet-card ${vowels.includes(item.letter) ? 'alphabet-card--vowel' : ''}`}
            >
              <span className="alphabet-card__letter">{item.letter}</span>
              <span className="alphabet-card__type">{item.type}</span>
              <p className="alphabet-card__pronunciation">{item.pronunciation}</p>
              <div className="alphabet-card__example">
                <span className="alphabet-card__chamorro">{item.example}</span>
                <span className="alphabet-card__english">{item.exampleEnglish}</span>
              </div>
              {item.note && (
                <p className="alphabet-card__note">{item.note}</p>
              )}
            </div>
          ))}
        </div>

        <div className="pronunciation-notes">
          <h3 className="pronunciation-notes__title">Pronunciation Guide</h3>
          {pronunciationNotes.map((item) => (
            <div key={item.label} className="pronunciation-note">
              <span className="pronunciation-note__label">{item.label}</span>
              <p className="pronunciation-note__text">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Alphabet
