import { Fragment, useRef } from 'react'
import { ANATOMY_IMAGES } from './anatomyZones.js'

// Inline style for a zone: its shape in percent of the image, used by both
// the tap button (grown to at least 44px in anatomy.css) and the drawn shape.
function zoneStyle(zone) {
  const s = zone.shape
  if (s.type === 'ellipse') {
    return { '--cx': s.cx, '--cy': s.cy, '--w': s.w, '--h': s.h }
  }
  const xs = s.points.map((p) => p[0])
  const ys = s.points.map((p) => p[1])
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  const w = Math.max(...xs) - x0
  const h = Math.max(...ys) - y0
  return { '--cx': x0 + w / 2, '--cy': y0 + h / 2, '--w': w, '--h': h }
}

function polygonClip(zone) {
  const s = zone.shape
  if (s.type !== 'polygon') return undefined
  const { '--cx': cx, '--cy': cy, '--w': w, '--h': h } = zoneStyle(zone)
  const x0 = cx - w / 2
  const y0 = cy - h / 2
  const pts = s.points.map(([x, y]) => `${((x - x0) / w) * 100}% ${((y - y0) / h) * 100}%`)
  return `polygon(${pts.join(', ')})`
}

// Point on the zone's left or right edge, where a label's line ends.
function edgePoint(zone, side) {
  const { '--cx': cx, '--cy': cy, '--w': w } = zoneStyle(zone)
  return { x: side === 'left' ? cx - w / 2 : cx + w / 2, y: cy }
}

/**
 * One image with its tap zones and the labels for its found or tapped parts.
 *
 * zoneState(zone) returns a list of state names for the drawn shape:
 * 'hover', 'selected', 'flash', 'wrong', 'hint'.
 * onPointer(event, board, image) reports pointer moves, presses and exits
 * over the image, so the zone under the pointer can be tinted.
 * labels: [{ zone, y, text, sub, dot }] for zones on this image, y in
 * percent. With `dot`, the label's line ends in a small dot at the zone's
 * center instead of at its edge.
 */
function AnatomyFigure({
  image,
  zones,
  caption,
  labels,
  zoneState,
  zoneLabel,
  debugName,
  onActivate,
  onPointer,
}) {
  const boardRef = useRef(null)
  const img = ANATOMY_IMAGES[image]

  return (
    <figure className={`anatomy-fig anatomy-fig--${image}${debugName ? ' anatomy-fig--debug' : ''}`}>
      <div className="anatomy-fig__crop">
        <div
          className="anatomy-fig__board"
          ref={boardRef}
          onPointerMove={(e) => onPointer(e, boardRef.current, image)}
          onPointerDown={(e) => onPointer(e, boardRef.current, image)}
          onPointerUp={(e) => onPointer(e, boardRef.current, image)}
          onPointerLeave={(e) => onPointer(e, boardRef.current, image)}
          onPointerCancel={(e) => onPointer(e, boardRef.current, image)}
        >
          <img className="anatomy-fig__image" src={img.src} alt={img.alt} draggable="false" />

          <svg className="anatomy-fig__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {labels.map(({ zone, y, dot }) => {
              const { '--cx': cx, '--cy': cy } = zoneStyle(zone)
              const end = dot ? { x: cx, y: cy } : edgePoint(zone, zone.side)
              return (
                <line
                  key={zone.id}
                  x1={zone.side === 'left' ? 0 : 100}
                  y1={y}
                  x2={end.x}
                  y2={end.y}
                />
              )
            })}
          </svg>

          {zones.map((zone) => {
            const states = zoneState(zone)
            return (
              <Fragment key={zone.id}>
                <button
                  type="button"
                  className={`anatomy-zone${zone.shape.type === 'polygon' ? ' anatomy-zone--box' : ''}`}
                  style={zoneStyle(zone)}
                  aria-label={zoneLabel(zone)}
                  onClick={(e) => onActivate(zone, e, boardRef.current)}
                />
                <span
                  className={`anatomy-zone__shape${states.map((s) => ` anatomy-zone__shape--${s}`).join('')}`}
                  style={{ ...zoneStyle(zone), clipPath: polygonClip(zone) }}
                  aria-hidden="true"
                />
              </Fragment>
            )
          })}

          {labels.filter((l) => l.dot).map(({ zone }) => (
            <span
              key={zone.id}
              className="anatomy-found-dot"
              style={zoneStyle(zone)}
              aria-hidden="true"
            />
          ))}

          {labels.map(({ zone, y, text, sub }) => (
            <span
              key={zone.id}
              className={`anatomy-label-slot anatomy-label-slot--${zone.side}`}
              style={{ top: `${y}%` }}
              aria-hidden="true"
            >
              <span className="anatomy-label">
                <span className="anatomy-label__word">{text}</span>
                {sub && <span className="anatomy-label__sub">{sub}</span>}
              </span>
            </span>
          ))}

          {debugName && zones.map((zone) => (
            <span
              key={zone.id}
              className="anatomy-debug-name"
              style={zoneStyle(zone)}
              aria-hidden="true"
            >
              {debugName(zone)}
            </span>
          ))}
        </div>
      </div>
      {caption && <figcaption className="anatomy-fig__caption">{caption}</figcaption>}
    </figure>
  )
}

export default AnatomyFigure
