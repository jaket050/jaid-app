import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MatchBoard from './MatchBoard'
import './match.css'

const ROUND_SIZE = 8
const WRONG_FLASH_MS = 500

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function MatchGame() {
  const [allWords, setAllWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Round state — chList and enList hold the same word objects in two
  // independently-shuffled orders for left/right columns.
  const [chList, setChList] = useState([])
  const [enList, setEnList] = useState([])
  const [seenIds, setSeenIds] = useState(() => new Set())
  const [matchedIds, setMatchedIds] = useState(() => new Set())
  const [selectedCh, setSelectedCh] = useState(null)
  const [selectedEn, setSelectedEn] = useState(null)
  const [wrongPair, setWrongPair] = useState(null)
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const [deckExhausted, setDeckExhausted] = useState(false)

  // Fetch all family vocabulary once on mount.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('vocabulary')
          .select('id, chamorro, english')
          .ilike('category', 'family')
        if (dbError) throw dbError
        if (!cancelled) setAllWords(data ?? [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load family vocabulary.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Deal a new round whenever the current one is empty (post-mount, post-complete, post-reset).
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
  // Match → record + clear; mismatch → mark wrongPair only.
  useEffect(() => {
    if (selectedCh === null || selectedEn === null) return
    if (wrongPair) return
    if (selectedCh === selectedEn) {
      setMatchedIds((prev) => new Set(prev).add(selectedCh))
      setSelectedCh(null)
      setSelectedEn(null)
      return
    }
    setWrongPair({ chId: selectedCh, enId: selectedEn })
  }, [selectedCh, selectedEn, wrongPair])

  // Separately, when a wrongPair is in flight, schedule its clear.
  // Owning the timeout in its own effect avoids the cleanup-cancels-timer
  // race that occurs when one effect mutates a value in its own deps.
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
    // The deal-round effect will then fill chList/enList from unplayed words,
    // or set deckExhausted if none remain.
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
    // Roundscompleted intentionally preserved across resets.
  }

  // Render branches
  if (loading) {
    return (
      <div className="match-game">
        <p className="match-game__status">Loading family vocabulary…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="match-game">
        <header className="match-game__header">
          <a className="match-game__home" href="/">← Home</a>
          <span className="match-game__brand">JAID</span>
          <span className="match-game__progress">Family Match</span>
        </header>
        <p className="match-game__status match-game__status--error">{error}</p>
      </div>
    )
  }

  return (
    <div className="match-game">
      <header className="match-game__header">
        <a className="match-game__home" href="/">← Home</a>
        <span className="match-game__brand">JAID</span>
        <span className="match-game__progress">
          Round {roundsCompleted + 1} · {matchedIds.size}/{chList.length || 0} matched ·{' '}
          {roundsCompleted} completed
        </span>
      </header>

      {deckExhausted ? (
        allWords.length === 0 ? (
          <div className="match-game__overlay">
            <h2 className="match-game__overlay-title">No family vocabulary yet</h2>
            <p className="match-game__overlay-text">
              Add some family-category entries via the admin page to play.
            </p>
            <a className="match-game__btn" href="/">← Back to home</a>
          </div>
        ) : (
          <div className="match-game__overlay">
            <h2 className="match-game__overlay-title">All family words mastered!</h2>
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
            Match each CHamoru word to its English equivalent. Tap a word from each column to make a pair.
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
          />
        </>
      )}
    </div>
  )
}

export default MatchGame
