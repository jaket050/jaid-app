import { geoMercator, geoPath } from 'd3-geo'
import { guamMunicipalities } from '../data/guamMunicipalities.generated.js'

const WIDTH  = 440
const HEIGHT = 720

// Computed once at module level — same approach as GuahanMap.jsx.
const projection = geoMercator().fitSize([WIDTH, HEIGHT], guamMunicipalities)
const pathGen    = geoPath(projection)

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
      {features.map((feature) => {
        const id       = feature.properties.id
        const isLocked = lockedIds.has(id)
        const isWrong  = wrongId === id
        const [lng, lat] = feature.properties.centroidLngLat
        const [cx, cy]   = projection([lng, lat])

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
    </svg>
  )
}

export default MunicipalityMap
