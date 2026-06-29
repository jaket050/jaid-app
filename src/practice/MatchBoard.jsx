function cellClass({ isMatched, isSelected, isWrong }) {
  const classes = ['match-card']
  if (isMatched) classes.push('match-card--matched')
  if (isSelected) classes.push('match-card--selected')
  if (isWrong) classes.push('match-card--wrong')
  return classes.join(' ')
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
            >
              {w.chamorro}
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
            >
              {w.english}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MatchBoard
