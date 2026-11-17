import { Check } from 'lucide-react'

function cellClass({ isMatched, isSelected, isWrong }) {
  const classes = ['match-card']
  if (isMatched) classes.push('match-card--matched')
  if (isSelected) classes.push('match-card--selected')
  if (isWrong) classes.push('match-card--wrong')
  return classes.join(' ')
}

// Non-color sign of a matched card: a check badge on its top right corner,
// outside the word's box. Screen readers get the button's aria-label.
function MatchedMark() {
  return (
    <span className="match-card__check" aria-hidden="true">
      <Check size={12} strokeWidth={3} />
    </span>
  )
}

function MatchBoard({
  chList,
  enList,
  matchedIds,
  selectedCh,
  selectedEn,
  wrongPair,
  onSelectCh,
  onSelectEn,
  colBTitle = 'English',
}) {
  return (
    <div className="match-board">
      <div className="match-board__column">
        <h3 className="match-board__col-title">CHamoru</h3>
        {chList.map((w) => {
          const isMatched = matchedIds.has(w.id)
          return (
            <button
              key={w.id}
              type="button"
              className={cellClass({
                isMatched,
                isSelected: selectedCh === w.id,
                isWrong: wrongPair?.chId === w.id,
              })}
              onClick={() => onSelectCh(w.id)}
              disabled={isMatched}
              aria-label={isMatched ? `${w.chamorro}, matched` : undefined}
            >
              {w.chamorro}
              {isMatched && <MatchedMark />}
            </button>
          )
        })}
      </div>

      <div className="match-board__column">
        <h3 className="match-board__col-title">{colBTitle}</h3>
        {enList.map((w) => {
          const isMatched = matchedIds.has(w.id)
          return (
            <button
              key={w.id}
              type="button"
              className={cellClass({
                isMatched,
                isSelected: selectedEn === w.id,
                isWrong: wrongPair?.enId === w.id,
              })}
              onClick={() => onSelectEn(w.id)}
              disabled={isMatched}
              aria-label={isMatched ? `${w.english}, matched` : undefined}
            >
              {w.english}
              {isMatched && <MatchedMark />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MatchBoard
