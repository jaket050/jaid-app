function FilterBar({ filter, onFilterChange, category, onCategoryChange, categories, counts, onStartStudy, studyDisabled }) {
  const studyCount =
    filter === 'all' ? counts.all : filter === 'word' ? counts.words : counts.sayings

  return (
    <>
      <div className="filter-bar">
        <button
          className={`filter-btn${filter === "all" ? " active" : ""}`}
          onClick={() => onFilterChange("all")}
        >
          All ({counts.all})
        </button>
        <button
          className={`filter-btn${filter === "word" ? " active" : ""}`}
          onClick={() => onFilterChange("word")}
        >
          Words ({counts.words})
        </button>
        <button
          className={`filter-btn${filter === "saying" ? " active" : ""}`}
          onClick={() => onFilterChange("saying")}
        >
          Sayings ({counts.sayings})
        </button>
        <button
          className="btn-study"
          onClick={onStartStudy}
          disabled={studyDisabled}
        >
          Study ({studyCount})
        </button>
      </div>
      {categories.length > 1 && (
        <div className="category-filters">
          <div className="filter-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn${category === cat ? " active" : ""}`}
                onClick={() => onCategoryChange(cat)}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default FilterBar
