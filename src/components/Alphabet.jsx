import { useState } from 'react'
import { chamorroAlphabet, vowels, pronunciationNotes } from '../data/alphabet'

function Alphabet({ onExit }) {
  const [flippedCards, setFlippedCards] = useState(new Set())

  const toggleCard = (letter) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(letter)) {
        next.delete(letter)
      } else {
        next.add(letter)
      }
      return next
    })
  }

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
              className="alphabet-flip-container"
              onClick={() => toggleCard(item.letter)}
            >
              <div className={`alphabet-flip-inner ${flippedCards.has(item.letter) ? 'is-flipped' : ''}`}>

                <div className={`alphabet-card alphabet-card--front ${vowels.includes(item.letter) ? 'alphabet-card--vowel' : ''}`}>
                  <span className="alphabet-card__letter">{item.letter}</span>
                  <span className="alphabet-card__type">{item.type}</span>
                  <p className="alphabet-card__tap-hint">Tap to learn</p>
                </div>

                <div className={`alphabet-card alphabet-card--back ${vowels.includes(item.letter) ? 'alphabet-card--vowel' : ''}`}>
                  <span className="alphabet-card__letter alphabet-card__letter--small">{item.letter}</span>
                  <p className="alphabet-card__pronunciation">{item.pronunciation}</p>
                  {item.example ? (
                    <div className="alphabet-card__example">
                      <span className="alphabet-card__chamorro">{item.example}</span>
                      <span className="alphabet-card__english">{item.exampleEnglish}</span>
                    </div>
                  ) : (
                    <p className="alphabet-card__pending">Example coming soon</p>
                  )}
                  {item.note && (
                    <p className="alphabet-card__note">{item.note}</p>
                  )}
                  <p className="alphabet-card__tap-hint">Tap to flip back</p>
                </div>

              </div>
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

        <div className="dialect-note">
          <h3 className="dialect-note__title">A Note on Dialect</h3>
          <p className="dialect-note__text">
            JAID follows the official CHamoru orthography established
            by Kumision i Fino' CHamoru, which reflects the Guåhan
            standard. CHamoru is also spoken in the Northern Mariana
            Islands with some differences in vocabulary and spelling.
            Both dialects are part of the living language and carry
            equal cultural value. As JAID grows we aim to acknowledge
            and honor both.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Alphabet
