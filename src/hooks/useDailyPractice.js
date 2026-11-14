import { useCallback, useState } from 'react'

const KEY = 'jaid_practiced_today'
const STREAK_KEY = 'jaid_streak_count'
const LAST_KEY = 'jaid_last_practice_date'
// Set to 'local' once a date is written as a local calendar day. Dates stored
// before that were UTC days (toISOString) and get the legacy handling below.
const BASIS_KEY = 'jaid_practice_day_basis'

// The learner's local calendar day as YYYY-MM-DD.
export function localDayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

// Calendar arithmetic on a day key (safe across daylight saving changes).
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return localDayKey(new Date(y, m - 1, d + n))
}

// The local days a stored date could stand for. A legacy UTC day can sit one
// day off the learner's calendar: a day earlier west of UTC (Pacific
// evenings), a day later east of UTC (Guam mornings).
function candidateDays(stored, store, now) {
  if (store.getItem(BASIS_KEY) === 'local') return [stored]
  const offset = now.getTimezoneOffset()
  if (offset > 0) return [addDays(stored, -1), stored]
  if (offset < 0) return [stored, addDays(stored, 1)]
  return [stored]
}

export function readPracticeState(store, now = new Date()) {
  const today = localDayKey(now)
  const yesterday = addDays(today, -1)

  // "Practiced today" only when every reading of the stored day is today.
  const practiced = store.getItem(KEY)
  const hasPracticedToday = !!practiced &&
    candidateDays(practiced, store, now).every((d) => d === today)

  // The streak stays live if any reading is today or yesterday, so a legacy
  // date never resets an existing streak.
  const last = store.getItem(LAST_KEY)
  const count = parseInt(store.getItem(STREAK_KEY), 10)
  const live = !!last && !Number.isNaN(count) &&
    candidateDays(last, store, now).some((d) => d === today || d === yesterday)

  return { hasPracticedToday, streakCount: live ? count : 0 }
}

// Records practice for the learner's local today and returns the new streak.
export function recordPractice(store, now = new Date()) {
  const today = localDayKey(now)
  const yesterday = addDays(today, -1)
  const last = store.getItem(LAST_KEY)
  const stored = parseInt(store.getItem(STREAK_KEY), 10) || 0

  let count
  if (!last) {
    count = 1
  } else {
    const days = candidateDays(last, store, now)
    if (days.includes(today)) count = stored || 1 // same day, or can't rule it out: never double count
    else if (days.includes(yesterday)) count = stored + 1
    else count = 1 // a full local day was missed
  }

  store.setItem(KEY, today)
  store.setItem(LAST_KEY, today)
  store.setItem(STREAK_KEY, String(count))
  store.setItem(BASIS_KEY, 'local')
  return count
}

function readSafely() {
  try {
    return readPracticeState(localStorage)
  } catch {
    return { hasPracticedToday: false, streakCount: 0 }
  }
}

/**
 * Tracks daily practice and a running day streak, by the learner's local
 * calendar day.
 * - `jaid_practiced_today` (local date) gates the "practiced today" dot.
 * - `jaid_streak_count` / `jaid_last_practice_date` track the streak: the
 *   learner's local yesterday increments it, a missed local day resets to 1.
 * - "Today" snapshot is fixed at mount; reload required for a midnight rollover.
 */
export function useDailyPractice() {
  const [hasPracticedToday, setHasPracticedToday] = useState(
    () => readSafely().hasPracticedToday
  )
  const [streakCount, setStreakCount] = useState(() => readSafely().streakCount)

  const markPracticed = useCallback(() => {
    try {
      setStreakCount(recordPractice(localStorage))
    } catch {
      // localStorage unavailable — still reflect at least a 1-day streak in memory
      setStreakCount(prev => (prev > 0 ? prev : 1))
    }
    setHasPracticedToday(true)
  }, [])

  return { hasPracticedToday, markPracticed, streakCount }
}
