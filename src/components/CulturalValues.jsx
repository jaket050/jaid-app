function CulturalValues() {
  const values = [
    {
      chamorro: "Respetu",
      english: "Respect",
      description: "Honoring elders, family, and community through words and actions. At the heart of every CHamoru relationship.",
      icon: "respitu"
    },
    {
      chamorro: "Inafa'maolek",
      english: "Interdependence",
      description: "The spirit of making things good for one another. In CHamoru culture, no one stands alone.",
      icon: "inafamaolek"
    },
    {
      chamorro: "Fama'taotao",
      english: "Human Dignity",
      description: "To treat each person as a full human being deserving of care, dignity, and respect.",
      icon: "famataotao"
    }
  ]

  return (
    <>
      <div className="cultural-values__header">
        <span className="cultural-values__label">Core Values</span>
      </div>
      <div className="cultural-values-wrapper">
        <img
          src="/ti-leaf.png"
          alt=""
          className="cultural-values-lei"
          aria-hidden="true"
        />
        <div className="cultural-values">
          <div className="cultural-values__grid">
            {values.map((value) => (
              <div key={value.chamorro} className="value-card">
                <h3 className="value-card__chamorro">{value.chamorro}</h3>
                <p className="value-card__english">{value.english}</p>
                <p className="value-card__desc">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default CulturalValues
