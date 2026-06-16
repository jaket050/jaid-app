import { useState } from 'react'
import { Check } from 'lucide-react'
import { nextCategory } from '../utils/learningPath'

const QUESTION_COUNT = 10
const ADVANCE_MS = 1100

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Build a fixed question set: each is a category word plus four English options
// (its own english + three distinct distractors drawn from the full vocabulary).
// All text comes directly from Supabase data — nothing is generated.
function buildQuestions(words, category) {
  const pool = category === 'all'
    ? words
    : words.filter((w) => w.category === category)
  const questionWords = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length))

  return questionWords.map((word) => {
    const correct = word.english
    const distractorPool = [...new Set(
      words
        .filter((w) => w.english && w.english !== correct)
        .map((w) => w.english)
    )]
    const distractors = shuffle(distractorPool).slice(0, 3)
    return { word, correct, options: shuffle([correct, ...distractors]) }
  })
}

function QuizMode({ words, category, onSelectDeck, onExit }) {
  const [questions] = useState(() => buildQuestions(words, category))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)

  const backLabel = category && category !== 'all' ? `← Back to ${category}` : '← Home'

  // Guard: not enough data to build a quiz (shouldn't happen — gated at 4+ words).
  if (questions.length === 0) {
    return (
      <div className="quiz-mode">
        <div className="study-mode__header">
          <button className="btn-exit-study" onClick={onExit}>{backLabel}</button>
          <span className="study-mode__brand">JAID</span>
          <span className="study-mode__progress">Quiz</span>
        </div>
        <div className="quiz-mode__body">
          <p className="quiz-mode__empty">Not enough vocabulary to build a quiz here.</p>
        </div>
      </div>
    )
  }

  // Summary screen
  if (idx >= questions.length) {
    const pct = Math.round((score / questions.length) * 100)
    const suggestion = nextCategory(category)
    return (
      <div className="study-summary">
        <div className="study-summary__phrase">
          <h2 className="study-summary__chamorro">Si Yu'os Ma'åse'</h2>
          <p className="study-summary__english">Thank you</p>
        </div>
        <div className="study-summary__stats">
          <div className="study-summary__stat">
            <span className="study-summary__num">{score}/{questions.length}</span>
            <span className="study-summary__label">correct</span>
          </div>
          <div className="study-summary__stat">
            <span className="study-summary__num">{pct}%</span>
            <span className="study-summary__label">score</span>
          </div>
        </div>
        <button className="btn-back-to-browse" onClick={onExit}>Back to browse</button>
        {onSelectDeck && (
          <button className="btn-next-deck" onClick={() => onSelectDeck(suggestion)}>
            Try next: {suggestion}
          </button>
        )}
      </div>
    )
  }

  const q = questions[idx]

  const handleSelect = (option) => {
    if (locked) return
    setSelected(option)
    setLocked(true)
    if (option === q.correct) setScore((s) => s + 1)
    setTimeout(() => {
      setIdx((i) => i + 1)
      setSelected(null)
      setLocked(false)
    }, ADVANCE_MS)
  }

  const optionClass = (option) => {
    const classes = ['quiz-option']
    if (locked) {
      if (option === q.correct) classes.push('quiz-option--correct')
      else if (option === selected) classes.push('quiz-option--wrong')
    }
    return classes.join(' ')
  }

  return (
    <div className="quiz-mode">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>{backLabel}</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">Question {idx + 1} of {questions.length}</span>
      </div>

      <div className="quiz-mode__body">
        <p className="quiz-mode__prompt">What does this mean?</p>
        <h2 className="quiz__word">{q.word.chamorro}</h2>

        <div className="quiz-grid">
          {q.options.map((option) => (
            <button
              key={option}
              type="button"
              className={optionClass(option)}
              onClick={() => handleSelect(option)}
              disabled={locked}
            >
              <span className="quiz-option__text">{option}</span>
              {locked && option === q.correct && (
                <Check size={18} className="quiz-option__check" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuizMode
