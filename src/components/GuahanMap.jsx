import { useState, useRef, useEffect } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { guamMunicipalities } from '../data/guamMunicipalities.generated.js';
import styles from './GuahanMap.module.css';

// ---------------------------------------------------------------------------
// Projection — fit the full FeatureCollection to the SVG viewport
// ---------------------------------------------------------------------------
const WIDTH  = 440;
const HEIGHT = 720;

const projection = geoMercator().fitSize(
  [WIDTH, HEIGHT],
  guamMunicipalities
);

const pathGen = geoPath(projection);

// ---------------------------------------------------------------------------
// Fallback deck shown when a municipality has no vocabulary yet
// ---------------------------------------------------------------------------
function getDeck(municipality) {
  if (municipality.properties.vocabularyDeck?.length) {
    return municipality.properties.vocabularyDeck;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GuahanMap({ onExit }) {
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);

  const features = guamMunicipalities.features;

  function handleSelect(feature) {
    setActive(prev =>
      prev?.properties.id === feature.properties.id ? null : feature
    );
  }

  function handleClose() {
    setActive(null);
  }

  // Close panel on outside tap
  useEffect(() => {
    function onPointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setActive(null);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const deck = active ? getDeck(active) : null;

  return (
    <div className={styles.guahanMapShell}>
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">I Tåno'</span>
      </div>
      <div className={styles.mapHeader}>
        <p className={styles.eyebrow}>In partnership with the Kumision i Fino' CHamoru</p>
        <h2>I Tåno' — Guåhan</h2>
        <p className={styles.mapSubtitle}>
          Tap a municipality to explore its CHamoru name.
        </p>
      </div>

      <div className={styles.mapStage}>
        <svg
          className={styles.guahanSvg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          aria-label="Interactive map of Guåhan showing 19 municipalities"
        >
          {features.map((feature) => {
            const isActive = active?.properties.id === feature.properties.id;
            return (
              <g key={feature.properties.id}>
                <path
                  d={pathGen(feature)}
                  className={`${styles.municipality} ${isActive ? styles.isActive : ''}`}
                  onClick={() => handleSelect(feature)}
                  role="button"
                  tabIndex={0}
                  aria-label={feature.properties.displayName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(feature)}
                />
              </g>
            );
          })}

          {features.map((feature) => {
            const [lng, lat] = feature.properties.centroidLngLat;
            const [cx, cy]   = projection([lng, lat]);
            const isActive   = active?.properties.id === feature.properties.id;
            return (
              <circle
                key={`dot-${feature.properties.id}`}
                cx={cx}
                cy={cy}
                r={isActive ? 6 : 4}
                className={`${styles.centroidDot} ${isActive ? styles.isActive : ''}`}
                onClick={() => handleSelect(feature)}
                aria-hidden="true"
              />
            );
          })}
        </svg>
      </div>

      {/* Slide-up panel */}
      <div
        ref={panelRef}
        className={`${styles.vocabPanel} ${active ? styles.isOpen : ''}`}
        aria-live="polite"
      >
        {active && (
          <>
            <button
              className={styles.closePanel}
              onClick={handleClose}
              aria-label="Close panel"
            >
              ×
            </button>
            <p className={styles.panelEyebrow}>Municipality</p>
            <h3>{active.properties.displayName}</h3>
            <p className={styles.centroidText}>
              {active.properties.censusName}
            </p>

            {deck ? (
              <div className={styles.deckGrid}>
                {deck.map((word, i) => (
                  <div key={i} className={styles.vocabCard}>
                    {word}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyDeck}>
                Historical and cultural information coming soon.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
