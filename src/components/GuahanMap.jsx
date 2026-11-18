import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import { guamMunicipalities } from '../data/guamMunicipalities.generated.js';
import { MUNICIPALITY_CONTENT } from '../data/municipalityContent.js';
import { MUNICIPALITIES } from '../data/municipalityGameNames.js';
import { SUBTITLE_OVERRIDES } from '../data/municipalitySubtitles.js';
// Read only: the Municipalities game's projected shapes and each region's
// widest point. Same projection as this screen (the island fitted to
// 440 by 720), so they line up with the shapes drawn here.
import { INSET, REGIONS, REGIONS_BY_ID } from '../practice/municipalityMapData.js';
import { MIN_TAP, inTapArea, resolveExploreTap } from '../practice/municipalityLogic.js';
import styles from './GuahanMap.module.css';

// ---------------------------------------------------------------------------
// Views (in map units). The whole island, and the central cluster where the
// smallest municipalities are, padded so their neighbors show.
// ---------------------------------------------------------------------------
const ISLAND_VIEW = { x: -12, y: 66, w: 464, h: 590 };
const CLUSTER_VIEW = {
  x: INSET.x - INSET.w * 0.15,
  y: INSET.y - INSET.h * 0.15,
  w: INSET.w * 1.3,
  h: INSET.h * 1.3,
};
const ZOOM_MS = 380;

const FEATURES_BY_ID = new Map(guamMunicipalities.features.map((f) => [f.properties.id, f]));
// The English gloss for each municipality, from the Kumisión name list the
// Municipalities game uses (matched by municipality id).
const GLOSS_BY_ID = new Map(MUNICIPALITIES.map((m) => [m.id, m.english]));

// The shapes as drawn here: the same projection as the game's data, at one
// decimal place (a tenth of a map unit) to keep the page light. Each shape
// is defined once and reused by every layer with <use>.
const drawPath = geoPath(geoMercator().fitSize([440, 720], guamMunicipalities)).digits(1);
const SHAPE_D = new Map(guamMunicipalities.features.map((f) => [f.properties.id, drawPath(f)]));
const shapeId = (id) => `itano-shape-${id}`;
const shapeRef = (id) => <use key={id} href={`#${shapeId(id)}`} />;

// Bottom sheet at 1024px and below, side panel above.
const SHEET_QUERY = '(max-width: 1024px)';
const subscribeSheet = (onChange) => {
  const mq = window.matchMedia(SHEET_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
const useIsSheet = () => useSyncExternalStore(
  subscribeSheet,
  () => window.matchMedia(SHEET_QUERY).matches,
  () => false,
);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Static terrain: drawn once, never re-rendered on hover, selection or zoom.
// Elevation tint (lighter on the northern plateau, deeper green through the
// volcanic south), and a reef halo and shadow drawn as soft low opacity
// strokes (no SVG filters).
// ---------------------------------------------------------------------------
const Terrain = memo(function Terrain() {
  return (
    <g aria-hidden="true">
      <defs>
        {REGIONS.map((r) => <path key={r.id} id={shapeId(r.id)} d={SHAPE_D.get(r.id)} />)}
        <linearGradient id="itano-elevation" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="640">
          <stop offset="0" stopColor="#B4DE96" />
          <stop offset="0.45" stopColor="#8DCB78" />
          <stop offset="0.7" stopColor="#5FA85E" />
          <stop offset="1" stopColor="#3E8A4C" />
        </linearGradient>
      </defs>

      {/* Shadow, then the turquoise reef halo in the shallow water. */}
      <g transform="translate(3 5)" className={styles.shadow}>
        {REGIONS.map((r) => shapeRef(r.id))}
      </g>
      {[{ w: 22, o: 0.08 }, { w: 14, o: 0.12 }, { w: 8, o: 0.18 }, { w: 3.5, o: 0.28 }].map(({ w, o }) => (
        <g key={w} className={styles.reef} style={{ strokeWidth: w, strokeOpacity: o }}>
          {REGIONS.map((r) => shapeRef(r.id))}
        </g>
      ))}

      {/* Land with the elevation tint. */}
      <g className={styles.land}>
        {REGIONS.map((r) => shapeRef(r.id))}
      </g>

      {/* Thin borders so each municipality reads as distinct (real paths,
          so the line stays thin at every zoom). */}
      <g className={styles.borders}>
        {REGIONS.map((r) => <path key={r.id} d={SHAPE_D.get(r.id)} />)}
      </g>
    </g>
  );
});

// A small seal for the "in preparation" state.
function SealMark() {
  return (
    <svg className={styles.seal} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" />
      <circle cx="20" cy="20" r="14" />
      <path d="M20 9l2.6 7.4 7.4.1-5.9 4.6 2.2 7.5L20 24.2l-6.3 4.4 2.2-7.5-5.9-4.6 7.4-.1z" />
    </svg>
  );
}

// The card. Each content part shows only when its data exists; with none,
// the "in preparation" state shows instead. Nothing is generated here.
function MunicipalityCard({ id }) {
  const feature = FEATURES_BY_ID.get(id);
  const { displayName, vocabularyDeck } = feature.properties;
  // The English line under the name: a hand written override where one
  // exists, otherwise the English gloss. No Census name fallback: with
  // neither, the line is left out. It is also left out when it is the same
  // as the CHamoru name (Piti, Mangilao).
  const subtitle = SUBTITLE_OVERRIDES[id] ?? GLOSS_BY_ID.get(id) ?? '';
  const content = MUNICIPALITY_CONTENT[id] ?? {};
  const vocabulary = content.vocabulary?.length ? content.vocabulary : (vocabularyDeck?.length ? vocabularyDeck : null);
  const hasContent = Boolean(content.photo || content.history?.length || content.culture?.length || vocabulary);

  return (
    <div className={styles.cardBody}>
      <h2 className={styles.cardName} lang="ch">{displayName}</h2>
      {subtitle && subtitle !== displayName && (
        <p className={styles.cardSecondName}>{subtitle}</p>
      )}
      <hr className={styles.goldRule} />

      {hasContent ? (
        <>
          {content.photo && (
            <figure className={styles.photo}>
              <img src={content.photo.src} alt={content.photo.alt} />
              {content.photo.credit && <figcaption>{content.photo.credit}</figcaption>}
            </figure>
          )}
          {content.history?.length > 0 && (
            <section className={styles.section}>
              <h3>History</h3>
              {content.history.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}
          {content.culture?.length > 0 && (
            <section className={styles.section}>
              <h3>Culture</h3>
              {content.culture.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}
          {vocabulary && (
            <ul className={styles.vocab} aria-label="Vocabulary">
              {vocabulary.map((word, i) => <li key={i} lang="ch">{word}</li>)}
            </ul>
          )}
        </>
      ) : (
        <div className={styles.preparing}>
          <SealMark />
          <h3 className={styles.preparingTitle}>Cultural notes in preparation</h3>
          <p className={styles.preparingText}>
            History and cultural notes for each municipality are being prepared together with the Kumisión i Fino' CHamoru.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GuahanMap({ onExit }) {
  const [active, setActive] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [base, setBase] = useState('island'); // 'island' | 'cluster'
  const [view, setView] = useState(ISLAND_VIEW);
  const [sheetH, setSheetH] = useState(0);
  const isSheet = useIsSheet();

  const svgRef = useRef(null);
  const panelRef = useRef(null);
  const viewRef = useRef(ISLAND_VIEW);
  const animRef = useRef(0);
  const dragRef = useRef(null);

  // Animate the viewBox to a target (instant with reduced motion).
  const zoomTo = useCallback((target) => {
    cancelAnimationFrame(animRef.current);
    const from = viewRef.current;
    if (reducedMotion()) {
      viewRef.current = target;
      setView(target);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ZOOM_MS);
      const e = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      const v = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      };
      viewRef.current = v;
      setView(v);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const baseView = base === 'cluster' ? CLUSTER_VIEW : ISLAND_VIEW;

  // Screen px per map unit and the letterbox offset of the current view.
  function screenMapping() {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const v = viewRef.current;
    const scale = Math.min(rect.width / v.w, rect.height / v.h);
    return {
      rect,
      scale,
      ox: rect.left + (rect.width - v.w * scale) / 2,
      oy: rect.top + (rect.height - v.h * scale) / 2,
    };
  }

  function toMap(event) {
    const m = screenMapping();
    const v = viewRef.current;
    return { x: v.x + (event.clientX - m.ox) / m.scale, y: v.y + (event.clientY - m.oy) / m.scale, scale: m.scale };
  }

  function select(id) {
    setActive((prev) => (prev === id ? null : id));
  }

  function zoomToCluster() {
    setBase('cluster');
    zoomTo(CLUSTER_VIEW);
  }

  function zoomToIsland() {
    setBase('island');
    zoomTo(ISLAND_VIEW);
  }

  // A tap selects the region under it, or the nearest whose 44px tap circle
  // holds it. Where several small places are within reach (the central
  // cluster), the first tap zooms in instead, so the next tap is exact.
  function handleTap(event) {
    if (event.detail === 0) return; // keyboard handled on the regions
    const { x, y, scale } = toMap(event);
    const near = REGIONS.filter((r) => inTapArea(r, x, y, scale));
    const crowded = near.length > 1 && near.some((r) => r.poleWidth * scale < MIN_TAP);
    if (crowded && base === 'island') {
      zoomToCluster();
      return;
    }
    const region = resolveExploreTap(REGIONS, x, y, scale);
    if (region) select(region.id);
  }

  function handlePointer(event) {
    if (event.pointerType !== 'mouse') return;
    if (event.type === 'pointerleave') {
      setHoverId(null);
      return;
    }
    const { x, y, scale } = toMap(event);
    setHoverId(resolveExploreTap(REGIONS, x, y, scale)?.id ?? null);
  }

  // Keyboard: Enter or Space selects. Focusing a place too small to see at
  // the island view zooms into the cluster so its focus ring shows.
  function handleRegionKey(event, id) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(id);
    }
  }

  function handleRegionFocus(event, region) {
    if (!event.target.matches(':focus-visible')) return;
    setFocusId(region.id);
    const { scale } = screenMapping();
    if (base === 'island' && region.poleWidth * scale < MIN_TAP) zoomToCluster();
  }

  // Close on an outside tap (not on the map, which toggles itself) and on
  // Escape.
  useEffect(() => {
    function onPointerDown(e) {
      if (panelRef.current?.contains(e.target) || svgRef.current?.contains(e.target)) return;
      if (e.target.closest?.('button')) return;
      setActive(null);
    }
    function onKey(e) {
      if (e.key === 'Escape') setActive(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // The sheet's height, so the map can keep the selected place above it.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !isSheet) return;
    const ro = new ResizeObserver(([entry]) => setSheetH(entry.target.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSheet, active]);

  // On phones, pan the map so the selected place sits above the sheet;
  // return to the base view when the sheet closes.
  useEffect(() => {
    if (!isSheet || !svgRef.current) return;
    if (!active) {
      zoomTo(baseView);
      return;
    }
    if (!sheetH) return;
    const region = REGIONS_BY_ID.get(active);
    const m = screenMapping();
    const v = baseView;
    const b = region.bounds;
    const top = m.rect.top + (m.rect.height - v.h * m.scale) / 2;
    const regionTop = top + (b.y - v.y) * m.scale;
    const regionBottom = top + (b.y + b.h - v.y) * m.scale;
    const limit = window.innerHeight - sheetH - 16;
    let dy = 0;
    if (regionBottom > limit) dy = (regionBottom - limit) / m.scale;
    if (regionTop - dy * m.scale < m.rect.top + 8) dy = (regionTop - m.rect.top - 8) / m.scale;
    zoomTo({ ...v, y: v.y + dy });
    // screenMapping reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sheetH, isSheet, base]);

  // The drag handle: drag the sheet down to close it.
  function onHandleDown(e) {
    dragRef.current = { y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleMove(e) {
    if (!dragRef.current || !panelRef.current) return;
    const dy = Math.max(0, e.clientY - dragRef.current.y);
    panelRef.current.style.transform = `translateY(${dy}px)`;
  }
  function onHandleUp(e) {
    if (!dragRef.current || !panelRef.current) return;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = null;
    panelRef.current.style.transform = '';
    if (dy > 70) setActive(null);
  }

  const showPanel = !isSheet || active;
  const overlays = [
    ...(hoverId && hoverId !== active ? [{ id: hoverId, kind: 'hover' }] : []),
    ...(active ? [{ id: active, kind: 'active' }] : []),
    ...(focusId ? [{ id: focusId, kind: 'focus' }] : []),
  ];

  return (
    <div className={styles.guahanMapShell}>
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress" aria-hidden="true" />
      </div>

      <div className={styles.body}>
        <div className={styles.mapColumn}>
          <div className={styles.mapHeader}>
            <p className={`${styles.eyebrow} ${styles.eyebrowAsWritten}`}>In partnership with the Kumisión i Fino' CHamoru</p>
            <h1 className={styles.title}>I Tåno' — Guåhan</h1>
            {isSheet && (
              <p className={styles.mapSubtitle}>Tap a municipality to explore its CHamoru name.</p>
            )}
          </div>

          <div className={styles.mapStage}>
            {base === 'cluster' && (
              <button type="button" className={styles.zoomOut} onClick={zoomToIsland}>
                Whole island
              </button>
            )}
            <svg
              ref={svgRef}
              className={styles.guahanSvg}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              role="group"
              aria-label="Interactive map of Guåhan showing 19 municipalities"
              onClick={handleTap}
              onPointerMove={handlePointer}
              onPointerLeave={handlePointer}
            >
              <Terrain />

              {/* Focusable regions: transparent, for keyboard and screen readers. */}
              {REGIONS.map((r) => (
                <use
                  key={r.id}
                  href={`#${shapeId(r.id)}`}
                  className={styles.region}
                  role="button"
                  tabIndex={0}
                  aria-label={r.name}
                  aria-pressed={active === r.id}
                  onKeyDown={(e) => handleRegionKey(e, r.id)}
                  onFocus={(e) => handleRegionFocus(e, r)}
                  onBlur={() => setFocusId(null)}
                />
              ))}

              {overlays.map(({ id, kind }) => (
                <g key={`${kind}-${id}`} className={`${styles.overlay} ${styles[kind]}`} aria-hidden="true">
                  <path d={SHAPE_D.get(id)} className={styles.overlayOuter} />
                  <path d={SHAPE_D.get(id)} className={styles.overlayInner} />
                </g>
              ))}
            </svg>
          </div>
        </div>

        {showPanel && (
          <aside
            ref={panelRef}
            className={`${styles.panel} ${isSheet ? styles.sheet : ''}`}
            aria-live="polite"
          >
            {isSheet && (
              <div
                className={styles.handle}
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                aria-hidden="true"
              >
                <span />
              </div>
            )}
            {active && (
              <button type="button" className={styles.close} aria-label="Close" onClick={() => setActive(null)}>
                <X size={22} aria-hidden="true" />
              </button>
            )}
            {active ? (
              <MunicipalityCard id={active} />
            ) : (
              <div className={styles.idle}>
                <p className={styles.idleText}>Tap a municipality to explore its CHamoru name.</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
