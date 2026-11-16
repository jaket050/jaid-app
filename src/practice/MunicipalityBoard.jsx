import { useEffect, useId } from 'react'
import { INSET, REGIONS, REGIONS_BY_ID as regionById } from './municipalityMapData.js'

// Highlight layers per state, drawn over the land so their edges are never
// hidden by a neighbor's border. Each is a stack of strokes, outside first.
const STATE_ORDER = ['selected', 'hover', 'hint', 'wrong', 'flash', 'focus']

/**
 * One map view: the level's main map, or the zoomed view of the center.
 *
 * boxRef:      ref for the view's box (the parent draws the zoom lines)
 * frame:       { x, y, w, h } map units shown
 * levelIds:    Set of region ids that are in play (others show muted)
 * order:       region ids in Tab order (main view only)
 * states:      { [regionId]: ['hover', 'selected', ...] }
 * found:       Set of region ids filled in the found color (Play)
 * checks:      region ids that show a check mark at their widest point
 * labels:      [{ id, lines, box, fontPx?, pointer? }] name labels, boxes in
 *              map units; fontPx overrides the size ("Show all names" on
 *              All only); pointer is a line from the place's dot to a label
 *              that sits beside its place
 * numbers:     [{ id, n, x, y }] numbered dots for "Show all names"
 * caption:     text shown on the zoomed view
 * scale:       CSS px per map unit, for the main map's soft edges
 * The main view is in the Tab order; the zoomed view is pointer only.
 */
function MunicipalityBoard({
  kind,
  boxRef,
  frame,
  levelIds,
  order,
  states,
  found,
  checks,
  labels,
  numbers,
  showInsetOutline,
  caption,
  scale,
  regionLabel,
  onTap,
  onPointer,
  onKeyActivate,
  onFocusRegion,
  onScale,
}) {
  const interactive = kind === 'main'
  const maskId = useId()
  // The main map's land fades out over its last 18px, so the muted rest of
  // the island never ends in a straight cut. Only the land is masked: the
  // ocean is drawn whole, so it meets the panel's ocean with no seam.
  const fade = kind === 'main' && scale > 0 ? Math.min(18 / scale, frame.w / 4, frame.h / 4) : 0
  const fx = fade / frame.w
  const fy = fade / frame.h

  // Report CSS px per map unit, for tap circles and label placement.
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => onScale(kind, entry.contentRect.width / frame.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [boxRef, kind, frame.w, onScale])

  function toMap(event) {
    const rect = boxRef.current.getBoundingClientRect()
    return {
      x: frame.x + ((event.clientX - rect.left) / rect.width) * frame.w,
      y: frame.y + ((event.clientY - rect.top) / rect.height) * frame.h,
      scale: rect.width / frame.w,
    }
  }

  const pct = (x, y) => ({
    left: `${((x - frame.x) / frame.w) * 100}%`,
    top: `${((y - frame.y) / frame.h) * 100}%`,
  })

  const outRegions = REGIONS.filter((r) => !levelIds.has(r.id))
  const inRegions = order.map((id) => regionById.get(id))

  return (
    <div
      ref={boxRef}
      className={`muni-view muni-view--${kind}`}
      style={{ '--ar': frame.w / frame.h }}
    >
      <svg
        className="muni-view__svg"
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        role={interactive ? 'group' : undefined}
        aria-label={interactive ? 'Municipalities' : undefined}
        aria-hidden={interactive ? undefined : 'true'}
        onClick={(e) => { if (e.detail !== 0) onTap(toMap(e)) }}
        onPointerMove={(e) => onPointer(e, toMap(e))}
        onPointerDown={(e) => onPointer(e, toMap(e))}
        onPointerUp={(e) => onPointer(e, null)}
        onPointerLeave={(e) => onPointer(e, null)}
        onPointerCancel={(e) => onPointer(e, null)}
      >
        <rect className="muni-ocean" x={frame.x} y={frame.y} width={frame.w} height={frame.h} />

        {fade > 0 && (
          <defs>
            <linearGradient id={`${maskId}-gx`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset={fx} stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset={1 - fx} stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${maskId}-gy`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset={fy} stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset={1 - fy} stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <mask id={`${maskId}-mx`} maskUnits="userSpaceOnUse" x={frame.x} y={frame.y} width={frame.w} height={frame.h}>
              <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${maskId}-gx)`} />
            </mask>
            <mask id={`${maskId}-my`} maskUnits="userSpaceOnUse" x={frame.x} y={frame.y} width={frame.w} height={frame.h}>
              <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={`url(#${maskId}-gy)`} />
            </mask>
          </defs>
        )}

        <g mask={fade > 0 ? `url(#${maskId}-my)` : undefined}>
          <g mask={fade > 0 ? `url(#${maskId}-mx)` : undefined}>
            {outRegions.map((r) => (
              <path key={r.id} d={r.d} className="muni-region muni-region--out" aria-hidden="true" />
            ))}
            {inRegions.map((r) => (
              <path
                key={r.id}
                d={r.d}
                className={`muni-region muni-region--shade-${r.shade}${found.has(r.id) ? ' muni-region--found' : ''}`}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : -1}
                aria-hidden={interactive ? undefined : 'true'}
                aria-label={interactive ? regionLabel(r) : undefined}
                onKeyDown={interactive ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onKeyActivate(r)
                  }
                } : undefined}
                onFocus={interactive ? (e) => onFocusRegion(r.id, e.target.matches(':focus-visible')) : undefined}
                onBlur={interactive ? () => onFocusRegion(null, false) : undefined}
              />
            ))}

            {showInsetOutline && (
              <g className="muni-inset-outline" aria-hidden="true">
                <rect className="muni-inset-outline__halo" x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
                <rect className="muni-inset-outline__line" x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
              </g>
            )}

            {STATE_ORDER.flatMap((state) => inRegions
              .filter((r) => states[r.id]?.includes(state))
              .map((r) => (
                <g key={`${state}-${r.id}`} className={`muni-hl muni-hl--${state}`} aria-hidden="true">
                  <path d={r.d} className="muni-hl__ring" />
                  <path d={r.d} className="muni-hl__edge" />
                  <path d={r.d} className="muni-hl__inner" />
                </g>
              )))}

            {labels.filter((l) => l.pointer).map(({ id, pointer: [[x1, y1], [x2, y2]] }) => (
              <g key={`pointer-${id}`} className="muni-pointer" aria-hidden="true">
                <line className="muni-pointer__halo" x1={x1} y1={y1} x2={x2} y2={y2} />
                <line className="muni-pointer__line" x1={x1} y1={y1} x2={x2} y2={y2} />
              </g>
            ))}
          </g>
        </g>
      </svg>

      {labels.filter((l) => l.pointer).map(({ id, pointer: [[x, y]] }) => (
        <span key={`dot-${id}`} className="muni-place-dot" style={pct(x, y)} aria-hidden="true" />
      ))}

      {checks.map((id) => {
        const [px, py] = regionById.get(id).pole
        return (
          <svg key={`check-${id}`} className="muni-check" style={pct(px, py)} viewBox="0 0 20 20" aria-hidden="true">
            <path className="muni-check__edge" d="M5 10.5l3.2 3.2L15 6.8" />
            <path className="muni-check__mark" d="M5 10.5l3.2 3.2L15 6.8" />
          </svg>
        )
      })}

      {numbers.map(({ id, n, x, y }) => (
        <span key={`num-${id}`} className="muni-number" style={pct(x, y)} aria-hidden="true">{n}</span>
      ))}

      {labels.map(({ id, lines, box, fontPx }) => (
        <span
          key={`label-${id}`}
          className="muni-label"
          style={{ ...pct(box.x + box.w / 2, box.y + box.h / 2), ...(fontPx ? { fontSize: `${fontPx}px` } : null) }}
          aria-hidden="true"
          lang="ch"
        >
          {lines.map((text, i) => <span key={i} className="muni-label__line">{text}</span>)}
        </span>
      ))}

      {caption && <span className="muni-zoom-caption" aria-hidden="true">{caption}</span>}
    </div>
  )
}

export default MunicipalityBoard
