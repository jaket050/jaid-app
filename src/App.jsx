import { useState, useEffect } from 'react'
import './App.css'
import WordCard from './components/WordCard'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import StudyMode from './components/StudyMode'
import { useCompletedIds } from './hooks/useCompletedIds'

function App() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [view, setView] = useState("browse")
  const [error, setError] = useState(null)
  const [completedIds, toggleId] = useCompletedIds()

  useEffect(() => {
    const loadWords = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/vocabulary')
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }
        const data = await response.json()
        // Server's isCompleted is ignored — localStorage is the source of truth (see useCompletedIds).
        setWords(data)
      } catch {
        setError("Could not connect to JAID server. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    loadWords()
  }, [])

  const filteredWords = filter === "all"
    ? words
    : words.filter((item) => item.type === filter)

  const completedCount = words.filter((item) => completedIds.has(item.id)).length

  const counts = {
    all: words.length,
    words: words.filter((item) => item.type === "word").length,
    sayings: words.filter((item) => item.type === "saying").length
  }

  if (loading) return <p>Loading JAID vocabulary...</p>
  if (error) return <p>{error}</p>

  if (view === "study") {
    return (
      <StudyMode
        words={filteredWords}
        completedIds={completedIds}
        toggleId={toggleId}
        onExit={() => setView("browse")}
      />
    )
  }

  return (
    <div>
      <Header
        totalWords={words.length}
        completedCount={completedCount}
        words={words}
        completedIds={completedIds}
      />
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        onStartStudy={() => setView("study")}
        studyDisabled={filteredWords.length === 0}
      />
      <div className="card-list">
        {filteredWords.length === 0 ? (
          <p>No results found for this filter.</p>
        ) : (
          filteredWords.map((item) => (
            <WordCard
              key={item.id}
              chamorro={item.chamorro}
              english={item.english}
              type={item.type}
              difficulty={item.difficulty}
              culturalNote={item.culturalNote}
              isCompleted={completedIds.has(item.id)}
              onToggle={() => toggleId(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default App