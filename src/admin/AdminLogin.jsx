import { useState } from 'react'

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setError('')
    setSubmitting(true)
    try {
      await onLogin(password)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">JAID Admin</h1>
        <p className="admin-login__subtitle">Enter the admin password to continue.</p>

        <label className="admin-field">
          <span className="admin-field__label">Password</span>
          <input
            className="admin-field__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </label>

        {error && <p className="admin-login__error">{error}</p>}

        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={submitting || !password}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default AdminLogin
