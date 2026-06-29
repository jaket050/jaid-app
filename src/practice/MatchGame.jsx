import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSessionId } from '../hooks/useSessionId'
import { logEvent } from '../utils/logEvent'
import MatchBoard from './MatchBoard'
import './match.css'

const ROUND_SIZE = 8
const WRONG_FLASH_MS = 500

// ---------------------------------------------------------------------------
// Mode configuration
// ---------------------------------------------------------------------------

async function fetchVocab(category) {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('id, chamorro, english')
    .ilike('category', category)
  if (error) throw error
  return data ?? []
}

async function fetchAntonyms() {
  const { data, error } = await supabase
    .from('antonym_pairs')
    .select(`
      id,
      word_a:vocabulary!antonym_pairs_word_a_id_fkey(chamorro),
      word_b:vocabulary!antonym_pairs_word_b_id_fkey(chamorro)
    `)
    .eq('verified', true)
  if (error) throw error
  // Reuse the { id, chamorro, english } shape the board already understands.
  // The "english" slot holds the antonym's CHamoru word; the column title
  // in MatchBoard is overridden to "Its Opposite" to reflect that.
  return (data ?? []).map((p) => ({
    id: p.id,
    chamorro: p.word_a.chamorro,
    english: p.word_b.chamorro,
  }))
}

const MODE_CONFIG = {
  kinship: {
    label: 'Kinship',
    fetch: () => fetchVocab('family'),
    colBTitle: 'English',
    emptyMessage: 'No kinship vocabulary yet — add family-category entries via the admin page.',
  },
  weather: {
    label: 'Weather',
    fetch: () => fetchVocab('weather'),
    colBTitle: 'English',
    emptyMessage: 'No weather vocabulary yet.',
  },
  food: {
    label: 'Food',
    fetch: () => fetchVocab('food'),
    colBTitle: 'English',
    emptyMessage: 'No food vocabulary yet.',
  },
  antonyms: {
    label: 'Antonyms',
    fetch: fetchAntonyms,
    colBTitle: 'Its Opposite',
    emptyMessage: 'Antonym pairs are added after Kumision i Finoʼ CHamoru verification — check back soon.',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MatchGame({ mode = 'kinship' }) {
  useSessionId()

  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.kinship

  const [allWords, setAllWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [chList, setChList] = useState([])
  const [enList, setEnList] = useState([])
  const [seenIds, setSeenIds] = useState(() => new Set())
  const [matchedIds, setMatchedIds] = useState(() => new Set())
  const [selectedCh, setSelectedCh] = useState(null)
  const [selectedEn, setSelectedEn] = useState(null)
  const [wrongPair, setWrongPair] = useState(null)
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const [deckExhausted, setDeckExhausted] = useState(false)

  // Fetch deck on mount (mode is fixed for the lifetime of this component).
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const words = await config.fetch()
        if (!cancelled) setAllWords(words)
      } catch (err) {
        if (!cancelled) setError(err.message || `Failed to load ${config.label} vocabulary.`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Deal a new round whenever the current one is empty.
  useEffect(() => {
    if (loading || allWords.length === 0) return
    if (chList.length > 0) return
    if (deckExhausted) return

    const unplayed = allWords.filter((w) => !seenIds.has(w.id))
    if (unplayed.length === 0) {
      setDeckExhausted(true)
      return
    }
    const next = shuffle(unplayed).slice(0, ROUND_SIZE)
    setChList(shuffle(next))
    setEnList(shuffle(next))
    setSeenIds((prev) => {
      const out = new Set(prev)
      for (const w of next) out.add(w.id)
      return out
    })
    setMatchedIds(new Set())
    setSelectedCh(null)
    setSelectedEn(null)
    setWrongPair(null)
  }, [loading, allWords, chList.length, deckExhausted, seenIds])

  // Resolve a pair once both columns have a selection.
  useEffect(() => {
    if (selectedCh === null || selectedEn === null) return
    if (wrongPair) return
    if (selectedCh === selectedEn) {
      logEvent('card_game_pair_flipped', { word_id: selectedCh, pair_matched: true })
      setMatchedIds((prev) => new Set(prev).add(selectedCh))
      setSelectedCh(null)
      setSelectedEn(null)
      return
    }
    logEvent('card_game_pair_flipped', { word_id: selectedCh, pair_matched: false })
    setWrongPair({ chId: selectedCh, enId: selectedEn })
  }, [selectedCh, selectedEn, wrongPair])

  // Clear a wrong pair after the flash timeout.
  useEffect(() => {
    if (!wrongPair) return
    const t = setTimeout(() => {
      setWrongPair(null)
      setSelectedCh(null)
      setSelectedEn(null)
    }, WRONG_FLASH_MS)
    return () => clearTimeout(t)
  }, [wrongPair])

  const selectCh = (id) => {
    if (matchedIds.has(id) || wrongPair) return
    setSelectedCh(id)
  }
  const selectEn = (id) => {
    if (matchedIds.has(id) || wrongPair) return
    setSelectedEn(id)
  }

  const roundComplete = chList.length > 0 && matchedIds.size === chList.length

  const advanceRound = () => {
    setRoundsCompleted((c) => c + 1)
    setChList([])
    setEnList([])
  }

  const resetDeck = () => {
    setSeenIds(new Set())
    setChList([])
    setEnList([])
    setMatchedIds(new Set())
    setSelectedCh(null)
    setSelectedEn(null)
    setWrongPair(null)
    setDeckExhausted(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="match-game">
        <p className="match-game__status">Loading {config.label} vocabulary…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="match-game">
        <header className="match-game__header">
          <a className="match-game__home" href="/practice">← Modes</a>
          <span className="match-game__brand">JAID</span>
          <span className="match-game__progress">{config.label} Match</span>
        </header>
        <p className="match-game__status match-game__status--error">{error}</p>
      </div>
    )
  }

  return (
    <div className="match-game">
      <header className="match-game__header">
        <a className="match-game__home" href="/practice">← Modes</a>
        <span className="match-game__brand">JAID</span>
        <span className="match-game__progress">
          {config.label} · {matchedIds.size}/{chList.length || 0} matched ·{' '}
          {roundsCompleted} round{roundsCompleted === 1 ? '' : 's'}
        </span>
      </header>

      {deckExhausted ? (
        allWords.length === 0 ? (
          <div className="match-game__overlay">
            <h2 className="match-game__overlay-title">No {config.label} words yet</h2>
            <p className="match-game__overlay-text">{config.emptyMessage}</p>
            <a className="match-game__btn" href="/practice">← Choose a mode</a>
          </div>
        ) : (
          <div className="match-game__overlay">
            <h2 className="match-game__overlay-title">All {config.label} words mastered!</h2>
            <p className="match-game__overlay-text">
              You completed {roundsCompleted} round{roundsCompleted === 1 ? '' : 's'} —{' '}
              {allWords.length} word{allWords.length === 1 ? '' : 's'} seen.
            </p>
            <button className="match-game__btn" onClick={resetDeck}>
              Start over
            </button>
          </div>
        )
      ) : roundComplete ? (
        <div className="match-game__overlay">
          <h2 className="match-game__overlay-title">Round complete!</h2>
          <p className="match-game__overlay-text">
            Matched all {chList.length} pair{chList.length === 1 ? '' : 's'}.
          </p>
          <button className="match-game__btn" onClick={advanceRound}>
            Next round →
          </button>
        </div>
      ) : (
        <>
          <p className="match-game__instructions">
            {mode === 'antonyms'
              ? 'Match each CHamoru word to its opposite. Tap one from each column to make a pair.'
              : 'Match each CHamoru word to its English equivalent. Tap one from each column to make a pair.'}
          </p>
          <MatchBoard
            chList={chList}
            enList={enList}
            matchedIds={matchedIds}
            selectedCh={selectedCh}
            selectedEn={selectedEn}
            wrongPair={wrongPair}
            onSelectCh={selectCh}
            onSelectEn={selectEn}
            colBTitle={config.colBTitle}
          />
        </>
      )}
    </div>
  )
}

export default MatchGame
