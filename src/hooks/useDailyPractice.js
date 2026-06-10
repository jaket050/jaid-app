import { useCallback, useState } from 'react'

const KEY = 'jaid_practiced_today'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function readStored() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/**
 * Tracks whether the learner has marked at least one word today.
 * - Reads `jaid_practiced_today` (ISO YYYY-MM-DD) from localStorage on first render.
 * - `markPracticed()` writes today's date and sets state true.
 * - "Today" snapshot is fixed at mount; reload required for a midnight rollover
 *   (acceptable since the indicator is informational and the worst case is a
 *   one-session staleness until next page load).
 */
export function useDailyPractice() {
  const [hasPracticedToday, setHasPracticedToday] = useState(
    () => readStored() === todayISO()
  )

  const markPracticed = useCallback(() => {
    try {
      localStorage.setItem(KEY, todayISO())
    } catch {
      // localStorage unavailable — state still goes true; re-evaluated next mount
    }
    setHasPracticedToday(true)
  }, [])

  return { hasPracticedToday, markPracticed }
}
