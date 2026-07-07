import { useEffect, useState } from 'react'
import { MUNICIPALITIES } from '../data/municipalityGameNames.js'
import MunicipalityMap from './MunicipalityMap.jsx'
import './match.css'

const WRONG_FLASH_MS = 500

function MunicipalityGame() {
  const [activeNameId, setActiveNameId] = useState(null)
  const [lockedIds,    setLockedIds]    = useState(() => new Set())
  const [wrongId,      setWrongId]      = useState(null)

  // Clear the wrong-shape flash after the timeout.
  useEffect(() => {
    if (!wrongId) return
    const t = setTimeout(() => setWrongId(null), WRONG_FLASH_MS)
    return () => clearTimeout(t)
  }, [wrongId])

  function handleSelectName(id) {
    if (lockedIds.has(id) || wrongId) return
    setActiveNameId((prev) => (prev === id ? null : id))
  }

  function handleSelectShape(id) {
    if (!activeNameId || lockedIds.has(id) || wrongId) return
    if (id === activeNameId) {
      setLockedIds((prev) => new Set(prev).add(id))
      setActiveNameId(null)
    } else {
      setWrongId(id)
    }
  }

  const complete = lockedIds.size === MUNICIPALITIES.length

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
          Municipalities · {lockedIds.size}/{MUNICIPALITIES.length} matched
        </span>
      </header>

      {complete ? (
        <div className="match-game__overlay">
          <h2 className="match-game__overlay-title">All 19 placed!</h2>
          <p className="match-game__overlay-text">
            You correctly matched every CHamoru municipality name to its location on the map.
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
              ? 'Now tap its location on the map.'
              : 'Select a CHamoru name, then tap its location on the map.'}
          </p>
          <div className="muni-game__layout">
            <div className="muni-game__names">
              {MUNICIPALITIES.map((m) => {
                const isLocked   = lockedIds.has(m.id)
                const isSelected = activeNameId === m.id
                const isWrong    = isSelected && wrongId !== null

                let cls = 'muni-name'
                if (isLocked)        cls += ' muni-name--locked'
                else if (isWrong)    cls += ' muni-name--wrong'
                else if (isSelected) cls += ' muni-name--selected'

                return (
                  <button
                    key={m.id}
                    className={cls}
                    onClick={() => handleSelectName(m.id)}
                    disabled={isLocked}
                    aria-pressed={isSelected}
                  >
                    {m.chamorro}
                  </button>
                )
              })}
            </div>

            <div className="muni-game__map-wrap">
              <MunicipalityMap
                lockedIds={lockedIds}
                wrongId={wrongId}
                activeNameId={activeNameId}
                onSelect={handleSelectShape}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MunicipalityGame
