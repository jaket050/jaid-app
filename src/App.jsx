import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import './App.css'
import WordCard from './components/WordCard'
import Header from './components/Header'
import StudyMode from './components/StudyMode'
import DeckSelect from './components/DeckSelect'
import Alphabet from './components/Alphabet'
import About from './components/About'
import WordOfTheDay from './components/WordOfTheDay'
import CulturalValues from './components/CulturalValues'
import LearningPaths from './components/LearningPaths'
import SearchBar from './components/SearchBar'
import Toast from './components/Toast'
import { supabase } from './lib/supabase'
import { useCompletedIds } from './hooks/useCompletedIds'
import { useDailyPractice } from './hooks/useDailyPractice'
import { useSessionId } from './hooks/useSessionId'
import { logEvent } from './utils/logEvent'

const GuahanMap = lazy(() => import('./components/GuahanMap'))

function App() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [view, setView] = useState("browse")
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [studyWords, setStudyWords] = useState(null)
  const [toast, setToast] = useState(null)
  const [completedIds, toggleId] = useCompletedIds()
  const { hasPracticedToday, markPracticed, streakCount } = useDailyPractice()
  useSessionId() // ensure an anonymous session id exists for event logging

  const toggleIdWithPractice = useCallback((id) => {
    const becomingComplete = !completedIds.has(id)
    toggleId(id)
    markPracticed()
    if (becomingComplete) {
      const w = words.find(x => x.id === id)
      if (w) setToast({ id: Date.now(), chamorro: w.chamorro })
    }
  }, [completedIds, toggleId, markPracticed, words])

  const handleSelectCategory = (cat) => {
    setStudyWords(null)
    setCategory(cat)
    setView("study")
    logEvent('category_viewed', { category: cat })
  }

  const handlePracticeWord = (word) => {
    setStudyWords([word])
    setCategory(word.category ?? 'all')
    setView("study")
  }

  useEffect(() => {
    const loadWords = async () => {
      try {
        const { data, error } = await supabase
          .from('vocabulary')
          .select('id, chamorro, english, type, difficulty, category, culturalNote:cultural_note')
          .order('id')
        if (error) throw error
        // Server's isCompleted is ignored — localStorage is the source of truth (see useCompletedIds).
        setWords(data ?? [])
      } catch {
        setError("Could not connect to JAID server. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    loadWords()
  }, [])

  const filteredWords = words.filter((word) => {
    const categoryMatch = category === "all" || word.category === category
    const searchMatch = searchQuery === '' ||
      word.chamorro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.english.toLowerCase().includes(searchQuery.toLowerCase())
    return categoryMatch && searchMatch
  })

  const completedCount = words.filter((item) => completedIds.has(item.id)).length

  // Debounced search logging — fire one event 600ms after the learner stops
  // typing, so we capture meaningful searches rather than one row per keystroke.
  const resultCount = filteredWords.length
  useEffect(() => {
    if (searchQuery.trim() === '') return
    const t = setTimeout(() => {
      logEvent(resultCount > 0 ? 'search_success' : 'search_no_results', {
        search_term: searchQuery,
        category,
        result_count: resultCount,
      })
    }, 600)
    return () => clearTimeout(t)
  }, [searchQuery, category, resultCount])

  if (loading) return (
    <div className="app-status app-status--loading">
      <span className="app-status__brand">JAID</span>
      <p className="app-status__text">Loading vocabulary…</p>
    </div>
  )
  if (error) return (
    <div className="app-status app-status--error">
      <p className="app-status__title">Couldn't load JAID</p>
      <p className="app-status__text">{error}</p>
    </div>
  )

  if (view === "study") {
    return (
      <StudyMode
        key={studyWords ? `single-${studyWords[0].id}` : `cat-${category}`}
        words={studyWords ?? filteredWords}
        completedIds={completedIds}
        toggleId={toggleIdWithPractice}
        totalWords={words.length}
        category={category}
        onSelectDeck={(cat) => { setStudyWords(null); setCategory(cat); setView("study") }}
        onExit={() => { setStudyWords(null); setView("browse") }}
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

  if (view === "map") {
    return (
      <Suspense fallback={null}>
        <GuahanMap onExit={() => setView("browse")} />
      </Suspense>
    )
  }

  if (view === "deck-select") {
    return (
      <DeckSelect
        words={words}
        category={category}
        onSelectDeck={(selectedCategory) => {
          setStudyWords(null)
          setCategory(selectedCategory)
          setView("study")
        }}
        onExit={() => setView("browse")}
      />
    )
  }

  return (
    <div className="browse-view">
      <Header
        totalWords={words.length}
        completedCount={completedCount}
        words={words}
        completedIds={completedIds}
        hasPracticedToday={hasPracticedToday}
        streakCount={streakCount}
      />
      <div className="action-bar">
        <button
          className="btn-study"
          onClick={() => setView("deck-select")}
          disabled={filteredWords.length === 0}
        >
          PRACTICE ({words.length})
        </button>
        <button
          className="btn-match"
          onClick={() => { window.location.href = '/practice/family' }}
        >
          CARD MATCH
        </button>
        <button className="btn-alphabet" onClick={() => setView("alphabet")}>
          I ATFABETU
        </button>
        <button className="btn-about-nav" onClick={() => setView("about")}>
          ABOUT
        </button>
        <button className="btn-about-nav" onClick={() => setView("map")}>
          I Tåno'
        </button>
      </div>
      <SearchBar onSearch={setSearchQuery} />
      {searchQuery !== '' && (
        <div className="card-list">
          {filteredWords.length === 0 ? (
            <p className="no-results">
              No results found for "{searchQuery}"
            </p>
          ) : (
            filteredWords.map((item) => (
              <WordCard
                key={item.id}
                chamorro={item.chamorro}
                english={item.english}
                type={item.type}
                difficulty={item.difficulty}
                isCompleted={completedIds.has(item.id)}
                onToggle={() => toggleIdWithPractice(item.id)}
                onPractice={() => handlePracticeWord(item)}
              />
            ))
          )}
        </div>
      )}
      {searchQuery === '' && (
        <>
          <WordOfTheDay words={words} completedIds={completedIds} />
          <CulturalValues />
          <LearningPaths
            words={words}
            completedIds={completedIds}
            onSelectCategory={handleSelectCategory}
          />
        </>
      )}
      <footer className="browse-footer">
        <p>Vocabulary sourced from Kumision i Fino' CHamoru</p>
        <p className="browse-footer__privacy">
          JAID collects anonymous usage data to help the Kumision i Fino' CHamoru understand diaspora learner needs. No personal information is collected.
        </p>
      </footer>
      {toast && (
        <Toast key={toast.id} chamorro={toast.chamorro} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}

export default App