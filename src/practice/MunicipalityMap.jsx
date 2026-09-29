import { geoMercator, geoPath } from 'd3-geo'
import { guamMunicipalities } from '../data/guamMunicipalities.generated.js'

const WIDTH  = 440
const HEIGHT = 720

// Locked-shape label sizing: font-size scales with each shape's own
// projected area (not bounding box — several municipalities, e.g.
// santa-rita-sumai, are MultiPolygons with a small satellite part far from
// the main landmass, which inflates the combined bounding box without the
// shape actually being any bigger on screen) so small municipalities don't
// get labels bigger than their own outline, and large ones don't get
// labels stretched past a comfortable reading size.
const LABEL_FONT_FACTOR = 0.112
const LABEL_FONT_MIN    = 7
const LABEL_FONT_MAX    = 13

// A handful of names (e.g. "Agaña Heights-Tutuhan") are long relative to
// their own shape at any reasonable font size — wrapping the font size up
// to fit them would either overflow neighboring shapes or force every other
// label down to match. Instead, estimate each label's single-line width
// and wrap names that would run well past their available width to a
// second line, splitting at the existing space/hyphen nearest the middle
// (these compound names already read naturally as two parts, e.g. "Agaña
// Heights" / "Tutuhan"). CHAR_WIDTH_FACTOR is a rough average glyph-width
// ratio for the heading font, not a measured value.
const CHAR_WIDTH_FACTOR = 0.55
const WRAP_WIDTH_RATIO  = 1.3

// Computed once at module level — same approach as GuahanMap.jsx.
const projection = geoMercator().fitSize([WIDTH, HEIGHT], guamMunicipalities)
const pathGen    = geoPath(projection)

// Split `name` into two lines at the space/hyphen nearest its midpoint.
// Falls back to a single line if there's no space or hyphen to split on.
function wrapLabel(name, fontSize, boxWidth) {
  const estWidth = name.length * fontSize * CHAR_WIDTH_FACTOR
  if (estWidth <= boxWidth * WRAP_WIDTH_RATIO) return [name]

  const mid = name.length / 2
  let splitAt = -1
  let bestDist = Infinity
  for (let i = 0; i < name.length; i++) {
    if (name[i] === ' ' || name[i] === '-') {
      const dist = Math.abs(i - mid)
      if (dist < bestDist) {
        bestDist = dist
        splitAt = i
      }
    }
  }
  if (splitAt === -1) return [name]
  return [name.slice(0, splitAt).trim(), name.slice(splitAt + 1).trim()]
}

// Centroid projection + area-derived font size + line-wrapped label text —
// all pure functions of the static feature data, so computed once here
// rather than on every render.
const FEATURE_GEOM = guamMunicipalities.features.map((feature) => {
  const id = feature.properties.id
  const [cx, cy] = projection(feature.properties.centroidLngLat)
  const fontSize = Math.min(
    LABEL_FONT_MAX,
    Math.max(LABEL_FONT_MIN, Math.sqrt(pathGen.area(feature)) * LABEL_FONT_FACTOR)
  )
  const [[x0], [x1]] = pathGen.bounds(feature)
  const lines = wrapLabel(feature.properties.displayName, fontSize, x1 - x0)
  return { id, name: feature.properties.displayName, cx, cy, fontSize, lines }
})
const FEATURE_GEOM_BY_ID = new Map(FEATURE_GEOM.map((g) => [g.id, g]))

// Some municipalities (the old capital area: Hagåtña, Agaña Heights-Tutuhan,
// Barigåda, Mongmong-To'to-Maite', Sinahånña, Assan-Ma'ina — plus, at the
// same distance threshold, Chålan Pågu-Otdot and Yo'ña, which border that
// cluster) sit close enough together that no amount of per-shape font
// scaling keeps several of their labels on screen at once without overlap:
// e.g. Hagåtña and Agaña Heights-Tutuhan's centroids are only ~12.5px
// apart, closer than either name's width even at the smallest legible
// font. Persistence (reinforcing the matched name, the point of this
// feature) matters here as much as anywhere else on the map, so rather
// than hide or fade these labels, they're pinned to a fixed offset
// position with a thin leader line back to their actual shape — computed
// once, offline (not shipped), via a repulsion pass starting from the real
// centroids, repelling the 8 offset labels from each other AND from the
// nearest fixed non-crowded municipalities' own inline label positions
// (tamuneng-tomhom, piti, mangilao — all within ~130px of the cluster's
// center; an earlier pass that only repelled the 8 from each other put
// hagatna's label 41.9px from tamuneng-tomhom's, close enough to visibly
// collide). This is a static map of a fixed geometric relationship, not
// something that needs to be recalculated at runtime.
const LEADER_LABEL_POS = new Map([
  ['hagatna', [169.9, 292.5]],
  ['mongmong-toto-maite', [221.8, 331.5]],
  ['agana-heights-tutuhan', [124.7, 317.8]],
  ['assan-maina', [121.9, 373.2]],
  ['sinahanna', [170.7, 347.3]],
  ['barigada', [274.5, 292.3]],
  ['chalan-pagu-otdot', [211.0, 384.2]],
  ['yona', [176.8, 427.3]],
])

// Offset labels aren't constrained to fit inside their own shape anymore,
// so they use one fixed font size and a generous fixed wrap width instead
// of the per-shape area-derived values above.
const LEADER_LABEL_FONT_SIZE = 9
const LEADER_LABEL_WRAP_WIDTH = 70

const LEADER_LABEL_GEOM = new Map(
  [...LEADER_LABEL_POS].map(([id, [x, y]]) => {
    const { name, cx, cy } = FEATURE_GEOM_BY_ID.get(id)
    const lines = wrapLabel(name, LEADER_LABEL_FONT_SIZE, LEADER_LABEL_WRAP_WIDTH)
    return [id, { x, y, cx, cy, lines }]
  })
)

function MunicipalityMap({ lockedIds, wrongId, activeNameId, onSelect }) {
  const features = guamMunicipalities.features
  const hasSelection = activeNameId !== null

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`muni-map${hasSelection ? ' muni-map--active' : ''}`}
      aria-label="Interactive map of Guåhan — click a municipality to match it"
    >
      {features.map((feature) => {
        const id       = feature.properties.id
        const isLocked = lockedIds.has(id)
        const isWrong  = wrongId === id

        let cls = 'muni-shape'
        if (isLocked) cls += ' muni-shape--locked'
        else if (isWrong) cls += ' muni-shape--wrong'

        return (
          <path
            key={id}
            d={pathGen(feature)}
            className={cls}
            onClick={() => !isLocked && onSelect(id)}
            role="button"
            aria-label={feature.properties.displayName}
            aria-pressed={isLocked}
            tabIndex={isLocked ? -1 : 0}
            onKeyDown={(e) => e.key === 'Enter' && !isLocked && onSelect(id)}
          />
        )
      })}

      {/* Centroid dots — aid clicking tiny MultiPolygon municipalities */}
      {FEATURE_GEOM.map(({ id, cx, cy }) => {
        const isLocked = lockedIds.has(id)
        const isWrong  = wrongId === id

        let cls = 'muni-dot'
        if (isLocked) cls += ' muni-dot--locked'
        else if (isWrong) cls += ' muni-dot--wrong'

        return (
          <circle
            key={`dot-${id}`}
            cx={cx}
            cy={cy}
            r={4}
            className={cls}
            onClick={() => !isLocked && onSelect(id)}
            aria-hidden="true"
          />
        )
      })}

      {/* Leader lines for the offset labels below — drawn before the
          labels so the text sits visually on top of the line. */}
      {[...LEADER_LABEL_GEOM]
        .filter(([id]) => lockedIds.has(id))
        .map(([id, { x, y, cx, cy }]) => (
          <line
            key={`leader-${id}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="muni-leader-line"
          />
        ))}

      {/* Locked-shape name labels — painted last so they sit on top of
          every shape, dot, and leader line. Isolated shapes label inline
          at their own centroid, as always. Shapes in the crowded central
          cluster (LEADER_LABEL_POS) label at a fixed offset position
          instead, connected by the leader line above — both stay on
          screen permanently once matched. */}
      {FEATURE_GEOM
        .filter(({ id }) => lockedIds.has(id) && !LEADER_LABEL_GEOM.has(id))
        .map(({ id, cx, cy, fontSize, lines }) => (
          <text
            key={`label-${id}`}
            x={cx}
            y={cy}
            className="muni-label"
            style={{ fontSize }}
            textAnchor="middle"
            dominantBaseline={lines.length === 1 ? 'middle' : undefined}
            aria-hidden="true"
          >
            {lines.length === 1
              ? lines[0]
              : lines.map((line, i) => (
                  <tspan key={i} x={cx} dy={i === 0 ? '-0.6em' : '1.2em'} dominantBaseline="middle">
                    {line}
                  </tspan>
                ))}
          </text>
        ))}

      {[...LEADER_LABEL_GEOM]
        .filter(([id]) => lockedIds.has(id))
        .map(([id, { x, y, lines }]) => (
          <text
            key={`label-${id}`}
            x={x}
            y={y}
            className="muni-label"
            style={{ fontSize: LEADER_LABEL_FONT_SIZE }}
            textAnchor="middle"
            dominantBaseline={lines.length === 1 ? 'middle' : undefined}
            aria-hidden="true"
          >
            {lines.length === 1
              ? lines[0]
              : lines.map((line, i) => (
                  <tspan key={i} x={x} dy={i === 0 ? '-0.6em' : '1.2em'} dominantBaseline="middle">
                    {line}
                  </tspan>
                ))}
          </text>
        ))}
    </svg>
  )
}

export default MunicipalityMap
