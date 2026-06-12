function MapPreview({ onExit }) {
  return (
    <div className="map-preview">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">I Tåno'</span>
      </div>
      <div className="map-preview__content">
        <h2 className="map-preview__title">I Tåno'</h2>
        <p className="map-preview__subtitle">Map of Guåhan</p>
        <p className="map-preview__note">Coming soon</p>
      </div>
    </div>
  )
}

export default MapPreview
