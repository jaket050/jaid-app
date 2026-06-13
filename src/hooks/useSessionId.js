import { useState } from 'react'

const KEY = 'jaid_session_id'

/**
 * Read the anonymous session id from localStorage, generating and persisting a
 * fresh UUID on first use. Returns null if storage/crypto are unavailable
 * (e.g. private mode) so callers can no-op rather than throw.
 *
 * Shared by useSessionId (for components) and logEvent (for fire-and-forget
 * logging), so the storage key and creation logic live in one place.
 */
export function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}

/**
 * Returns a stable anonymous session id, creating one on first render. No
 * account or personal data — just a random UUID kept in localStorage.
 */
export function useSessionId() {
  const [sessionId] = useState(getOrCreateSessionId)
  return sessionId
}
