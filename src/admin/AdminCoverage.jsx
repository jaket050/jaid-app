import { useCallback, useEffect, useState } from 'react'
import { fetchCoverage } from './coverageApi'

function CoverageCard({ category, total, verified, unverified, percentVerified }) {
  return (
    <article className="coverage-card">
      <header className="coverage-card__header">
        <h3 className="coverage-card__title">{category}</h3>
        <span className="coverage-card__pct">{percentVerified}%</span>
      </header>
      <div
        className="coverage-bar"
        role="progressbar"
        aria-valuenow={percentVerified}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percentVerified}% of ${category} verified`}
      >
        <div
          className="coverage-bar__fill"
          style={{ width: `${percentVerified}%` }}
        />
      </div>
      <dl className="coverage-card__stats">
        <div>
          <dt>Total</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Verified</dt>
          <dd>{verified}</dd>
        </div>
        <div>
          <dt>Unverified</dt>
          <dd>{unverified}</dd>
        </div>
      </dl>
    </article>
  )
}

function AdminCoverage({ token, onExit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await fetchCoverage(token)
      setData(result)
    } catch (err) {
      if (err.status === 401) {
        onExit()
        return
      }
      setError(err.message || 'Failed to load coverage.')
    } finally {
      setLoading(false)
    }
  }, [token, onExit])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-header__title">JAID Admin · Coverage</h1>
        <div className="admin-header__actions">
          <a className="admin-btn admin-btn--ghost" href="/admin">
            Back to admin
          </a>
          <button
            className="admin-btn admin-btn--ghost"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="admin-main">
        {loading && !data && (
          <p className="admin-card__hint">Loading coverage…</p>
        )}

        {error && (
          <p className="admin-status admin-status--error" role="alert">
            {error}
          </p>
        )}

        {data && (
          <>
            <section className="admin-card">
              <h2 className="admin-card__title">Overall</h2>
              <p className="admin-card__hint">
                <strong>{data.totalWords}</strong> total vocabulary entries across{' '}
                <strong>{data.categories.length}</strong>{' '}
                {data.categories.length === 1 ? 'category' : 'categories'}. Sorted
                worst-verified first.
              </p>
            </section>

            {data.categories.length === 0 ? (
              <p className="admin-card__hint">No vocabulary entries yet.</p>
            ) : (
              <div className="coverage-grid">
                {data.categories.map((cat) => (
                  <CoverageCard key={cat.category} {...cat} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default AdminCoverage
