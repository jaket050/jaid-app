import { useRef } from 'react'
import { ANATOMY_SPOTS } from './anatomyGameSpots.js'

const VIEWS = [
  { key: 'face',  src: '/anatomy-face.png',          alt: 'CHamoru child face closeup, used to place facial feature names' },
  { key: 'front', src: '/anatomy-figure-front.png',  alt: 'CHamoru child figure, front view, used to place body part names' },
  { key: 'back',  src: '/anatomy-figure-back.png',   alt: 'CHamoru child figure, back view, used to place body part names' },
]

// Half of each marker's 44px square tap area (see .anatomy-dot in match.css).
const TAP_HALF = 22

// Tap areas can overlap where markers sit close together (Eye and Eyelashes
// are about 20px apart). When a pointer tap lands inside more than one
// unmatched marker's area, the marker for the selected word wins if it is
// one of them; otherwise the marker whose center is nearest the tap wins.
// Keyboard activation (detail 0) always means the focused marker.
function resolveTap(event, spot, spots, board, lockedIds, activeNameId) {
  if (event.detail === 0 || !board) return spot.id
  const rect = board.getBoundingClientRect()
  const px = event.clientX - rect.left
  const py = event.clientY - rect.top

  const hits = spots
    .filter((s) => !lockedIds.has(s.id))
    .map((s) => {
      const dx = (s.x / 100) * rect.width - px
      const dy = (s.y / 100) * rect.height - py
      return { id: s.id, dx, dy, dist: Math.hypot(dx, dy) }
    })
    .filter((h) => Math.abs(h.dx) <= TAP_HALF && Math.abs(h.dy) <= TAP_HALF)

  if (hits.length === 0) return spot.id
  if (hits.some((h) => h.id === activeNameId)) return activeNameId
  return hits.reduce((best, h) => (h.dist < best.dist ? h : best)).id
}

function ImageBoard({ viewKey, src, alt, spots, lockedIds, wrongId, activeNameId, onSelect }) {
  const boardRef = useRef(null)
  const hasSelection = activeNameId !== null

  return (
    <div
      ref={boardRef}
      className={`anatomy-board anatomy-board--${viewKey}${hasSelection ? ' anatomy-board--active' : ''}`}
    >
      <img className="anatomy-board__image" src={src} alt={alt} />

      {spots.map((spot) => {
        const isLocked = lockedIds.has(spot.id)
        const isWrong  = wrongId === spot.id

        let cls = `anatomy-dot anatomy-dot--${viewKey}`
        if (isLocked) cls += ' anatomy-dot--locked'
        else if (isWrong) cls += ' anatomy-dot--wrong'

        return (
          <button
            key={spot.id}
            type="button"
            className={cls}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={(e) => {
              if (isLocked) return
              onSelect(resolveTap(e, spot, spots, boardRef.current, lockedIds, activeNameId))
            }}
            aria-label={spot.english}
            aria-pressed={isLocked}
            disabled={isLocked}
          >
            <span className="anatomy-dot__ring" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

function AnatomyBoard({ lockedIds, wrongId, activeNameId, onSelect }) {
  const byView = Object.fromEntries(
    VIEWS.map((v) => [v.key, ANATOMY_SPOTS.filter((s) => s.view === v.key)])
  )

  return (
    <div className="anatomy-boards">
      <ImageBoard
        viewKey="face"
        src="/anatomy-face.png"
        alt={VIEWS[0].alt}
        spots={byView.face}
        lockedIds={lockedIds}
        wrongId={wrongId}
        activeNameId={activeNameId}
        onSelect={onSelect}
      />

      <div className="anatomy-boards__row">
        <ImageBoard
          viewKey="front"
          src="/anatomy-figure-front.png"
          alt={VIEWS[1].alt}
          spots={byView.front}
          lockedIds={lockedIds}
          wrongId={wrongId}
          activeNameId={activeNameId}
          onSelect={onSelect}
        />
        <ImageBoard
          viewKey="back"
          src="/anatomy-figure-back.png"
          alt={VIEWS[2].alt}
          spots={byView.back}
          lockedIds={lockedIds}
          wrongId={wrongId}
          activeNameId={activeNameId}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}

export default AnatomyBoard
