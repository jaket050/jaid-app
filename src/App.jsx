import { useState, useEffect } from 'react'
import './App.css'
import WordCard from './components/WordCard'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import StudyMode from './components/StudyMode'
import DeckSelect from './components/DeckSelect'
import Alphabet from './components/Alphabet'
import About from './components/About'
import WordOfTheDay from './components/WordOfTheDay'
import CulturalValues from './components/CulturalValues'
import LearningPaths from './components/LearningPaths'
import SearchBar from './components/SearchBar'
import { useCompletedIds } from './hooks/useCompletedIds'

function App() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [category, setCategory] = useState("all")
  const [view, setView] = useState("browse")
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedIds, toggleId] = useCompletedIds()

  const handleSelectCategory = (cat) => {
    setCategory(cat)
    setView("deck-select")
  }

  useEffect(() => {
    const loadWords = async () => {
      try {
        const response = await fetch('https://jaid-server-production.up.railway.app/api/vocabulary')
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

  const filteredWords = words.filter((word) => {
    const typeMatch = filter === "all" || word.type === filter
    const categoryMatch = category === "all" || word.category === category
    const searchMatch = searchQuery === '' ||
      word.chamorro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.english.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && categoryMatch && searchMatch
  })

  const completedCount = words.filter((item) => completedIds.has(item.id)).length

  const inCategory = (item) => category === "all" || item.category === category
  const counts = {
    all: words.filter(inCategory).length,
    words: words.filter((item) => item.type === "word" && inCategory(item)).length,
    sayings: words.filter((item) => item.type === "saying" && inCategory(item)).length
  }

  const studyCount =
    filter === 'all' ? counts.all : filter === 'word' ? counts.words : counts.sayings

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

  if (view === "alphabet") {
    return (
      <Alphabet onExit={() => setView("browse")} />
    )
  }

  if (view === "about") {
    return <About onExit={() => setView("browse")} />
  }

  if (view === "deck-select") {
    return (
      <DeckSelect
        words={words}
        onSelectDeck={(selectedCategory) => {
          setFilter("all")
          setCategory(selectedCategory)
          setView("study")
        }}
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
      <div className="action-bar">
        <button
          className="btn-study"
          onClick={() => setView("deck-select")}
          disabled={filteredWords.length === 0}
        >
          PRACTICE ({studyCount})
        </button>
        <button className="btn-alphabet" onClick={() => setView("alphabet")}>
          I ATFABETU
        </button>
        <button className="btn-about-nav" onClick={() => setView("about")}>
          ABOUT
        </button>
      </div>
      <SearchBar onSearch={setSearchQuery} />
      {searchQuery === '' && (
        <>
          <WordOfTheDay words={words} onPractice={() => setView("deck-select")} />
          <CulturalValues />
          <LearningPaths words={words} onSelectCategory={handleSelectCategory} />
        </>
      )}
      {searchQuery === '' && (
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      )}
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