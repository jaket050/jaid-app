import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'jaid:completed:v1'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    // localStorage unavailable (private mode, disabled) or corrupt — start fresh
    return new Set()
  }
}

export function useCompletedIds() {
  const [completedIds, setCompletedIds] = useState(loadFromStorage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedIds]))
    } catch {
      // localStorage unavailable or quota exceeded — keep in-memory state only
    }
  }, [completedIds])

  const toggleId = useCallback((id) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return [completedIds, toggleId]
}
