import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from './adminApi'
import AddWordForm from './AddWordForm'
import WordList from './WordList'

function AdminPanel({ token, onLogout }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await adminApi.list(token)
      setWords(data)
    } catch (err) {
      // Auto-logout on 401 — the token is stale.
      if (err.status === 401) {
        onLogout()
        return
      }
      setError(err.message || 'Failed to load vocabulary.')
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => {
    refresh()
  }, [refresh])

  const categories = useMemo(() => {
    const set = new Set()
    for (const w of words) {
      if (w.category) set.add(w.category)
    }
    return [...set].sort()
  }, [words])

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-header__title">JAID Admin</h1>
        <button className="admin-btn admin-btn--ghost" onClick={onLogout}>
          Log out
        </button>
      </header>

      <main className="admin-main">
        <AddWordForm
          token={token}
          categories={categories}
          onAdded={refresh}
        />

        <WordList
          token={token}
          words={words}
          categories={categories}
          loading={loading}
          error={error}
          onChanged={refresh}
        />
      </main>
    </div>
  )
}

export default AdminPanel
