import { ANATOMY_SPOTS } from './anatomyGameSpots.js'

const VIEWS = [
  { key: 'face',  src: '/anatomy-face.png',          alt: 'CHamoru child face closeup, used to place facial-feature names' },
  { key: 'front', src: '/anatomy-figure-front.png',  alt: 'CHamoru child figure, front view, used to place body-part names' },
  { key: 'back',  src: '/anatomy-figure-back.png',   alt: 'CHamoru child figure, back view, used to place body-part names' },
]

function ImageBoard({ viewKey, src, alt, spots, lockedIds, wrongId, activeNameId, onSelect }) {
  const hasSelection = activeNameId !== null

  return (
    <div className={`anatomy-board anatomy-board--${viewKey}${hasSelection ? ' anatomy-board--active' : ''}`}>
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
            onClick={() => !isLocked && onSelect(spot.id)}
            aria-label={spot.english}
            aria-pressed={isLocked}
            disabled={isLocked}
          />
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
