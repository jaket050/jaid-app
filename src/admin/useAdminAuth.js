import { useCallback, useEffect, useState } from 'react'

const TOKEN_KEY = 'jaid_admin_token'

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // sessionStorage unavailable (private mode, etc.) — degrade silently.
  }
}

/**
 * Hook that owns the admin session token.
 *  - login(password) → POSTs to /admin-auth, stores token in sessionStorage on success
 *  - logout() → clears token
 *  - token → current token string or null
 *
 * Token expires 24h after issue; the server rejects expired tokens.
 * sessionStorage clears when the browser tab closes.
 */
export function useAdminAuth() {
  const [token, setToken] = useState(() => readToken())

  // Keep state in sync if another tab modifies storage (rare for sessionStorage but safe).
  useEffect(() => {
    const onStorage = () => setToken(readToken())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (password) => {
    const res = await fetch('/.netlify/functions/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = await res.json()
        detail = body.error || detail
      } catch {
        // ignore parse error
      }
      throw new Error(detail || 'Login failed')
    }
    const { token: newToken } = await res.json()
    writeToken(newToken)
    setToken(newToken)
    return newToken
  }, [])

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
  }, [])

  return { token, login, logout }
}
