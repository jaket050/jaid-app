function FilterBar({ filter, onFilterChange, counts }) {
  return (
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
    </div>
  )
}

export default FilterBar
