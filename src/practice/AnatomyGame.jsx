import { useEffect, useState } from 'react'
import { ANATOMY_SPOTS } from './anatomyGameSpots.js'
import AnatomyBoard from './AnatomyBoard.jsx'
import './match.css'

const WRONG_FLASH_MS = 500

function AnatomyGame() {
  const [activeNameId, setActiveNameId] = useState(null)
  const [lockedIds,    setLockedIds]    = useState(() => new Set())
  const [wrongId,      setWrongId]      = useState(null)

  // Clear the wrong-spot flash after the timeout.
  useEffect(() => {
    if (!wrongId) return
    const t = setTimeout(() => setWrongId(null), WRONG_FLASH_MS)
    return () => clearTimeout(t)
  }, [wrongId])

  function handleSelectName(id) {
    if (lockedIds.has(id) || wrongId) return
    setActiveNameId((prev) => (prev === id ? null : id))
  }

  function handleSelectSpot(id) {
    if (!activeNameId || lockedIds.has(id) || wrongId) return
    if (id === activeNameId) {
      setLockedIds((prev) => new Set(prev).add(id))
      setActiveNameId(null)
    } else {
      setWrongId(id)
    }
  }

  const complete = lockedIds.size === ANATOMY_SPOTS.length

  function reset() {
    setLockedIds(new Set())
    setActiveNameId(null)
    setWrongId(null)
  }

  return (
    <div className="muni-game">
      <header className="match-game__header">
        <a className="match-game__home" href="/practice">← Modes</a>
        <span className="match-game__brand">JAID</span>
        <span className="match-game__progress">
          Anatomy · {lockedIds.size}/{ANATOMY_SPOTS.length} matched
        </span>
      </header>

      {complete ? (
        <div className="match-game__overlay">
          <h2 className="match-game__overlay-title">All {ANATOMY_SPOTS.length} placed!</h2>
          <p className="match-game__overlay-text">
            You correctly matched every CHamoru body-part name to its spot on the figure.
          </p>
          <button className="match-game__btn" onClick={reset}>Play again</button>
          <a className="match-game__btn" href="/practice" style={{ marginTop: '0.5rem' }}>
            ← Modes
          </a>
        </div>
      ) : (
        <>
          <p className="match-game__instructions">
            {activeNameId
              ? 'Now tap its spot on the figure.'
              : 'Select a CHamoru name, then tap its spot on the figure.'}
          </p>
          <div className="muni-game__layout">
            <div className="muni-game__names">
              {ANATOMY_SPOTS.map((s) => {
                const isLocked   = lockedIds.has(s.id)
                const isSelected = activeNameId === s.id
                const isWrong    = isSelected && wrongId !== null

                let cls = 'muni-name'
                if (isLocked)        cls += ' muni-name--locked'
                else if (isWrong)    cls += ' muni-name--wrong'
                else if (isSelected) cls += ' muni-name--selected'

                return (
                  <button
                    key={s.id}
                    className={cls}
                    onClick={() => handleSelectName(s.id)}
                    disabled={isLocked}
                    aria-pressed={isSelected}
                  >
                    {s.chamorro}{isLocked && <> <span className="muni-name__en">({s.english})</span></>}
                  </button>
                )
              })}
            </div>

            <div className="muni-game__map-wrap">
              <AnatomyBoard
                lockedIds={lockedIds}
                wrongId={wrongId}
                activeNameId={activeNameId}
                onSelect={handleSelectSpot}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnatomyGame
