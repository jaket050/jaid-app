import { useCallback, useState } from 'react'

const KEY = 'jaid_practiced_today'
const STREAK_KEY = 'jaid_streak_count'
const LAST_KEY = 'jaid_last_practice_date'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayISO() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

function readStored() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function readStreak() {
  try {
    const last = localStorage.getItem(LAST_KEY)
    const count = parseInt(localStorage.getItem(STREAK_KEY), 10)
    if (!last || Number.isNaN(count)) return 0
    // Streak is only "live" if the last practice was today or yesterday.
    return last === todayISO() || last === yesterdayISO() ? count : 0
  } catch {
    return 0
  }
}

/**
 * Tracks daily practice and a running day streak.
 * - `jaid_practiced_today` (ISO date) gates the "practiced today" dot.
 * - `jaid_streak_count` / `jaid_last_practice_date` track the streak: a new
 *   day adjacent to the last increments it, a gap resets to 1.
 * - "Today" snapshot is fixed at mount; reload required for a midnight rollover.
 */
export function useDailyPractice() {
  const [hasPracticedToday, setHasPracticedToday] = useState(
    () => readStored() === todayISO()
  )
  const [streakCount, setStreakCount] = useState(readStreak)

  const markPracticed = useCallback(() => {
    const today = todayISO()
    try {
      const last = localStorage.getItem(LAST_KEY)
      let count
      if (last === today) {
        count = parseInt(localStorage.getItem(STREAK_KEY), 10) || 1
      } else if (last === yesterdayISO()) {
        count = (parseInt(localStorage.getItem(STREAK_KEY), 10) || 0) + 1
      } else {
        count = 1
      }
      localStorage.setItem(KEY, today)
      localStorage.setItem(LAST_KEY, today)
      localStorage.setItem(STREAK_KEY, String(count))
      setStreakCount(count)
    } catch {
      // localStorage unavailable — still reflect at least a 1-day streak in memory
      setStreakCount(prev => (prev > 0 ? prev : 1))
    }
    setHasPracticedToday(true)
  }, [])

  return { hasPracticedToday, markPracticed, streakCount }
}
