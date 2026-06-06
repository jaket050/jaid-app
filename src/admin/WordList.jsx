import { useState } from 'react'
import { adminApi } from './adminApi'

function EditableCell({ value, onSave, multiline = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(value ?? '')
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const save = async () => {
    if ((draft ?? '') === (value ?? '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      // Parent surfaces errors. Keep the editor open so the user can retry.
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button className="admin-cell admin-cell--readonly" onClick={startEdit}>
        {value || <span className="admin-cell__empty">—</span>}
      </button>
    )
  }

  return (
    <div className="admin-cell admin-cell--editing">
      {multiline ? (
        <textarea
          className="admin-field__input admin-field__input--textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
        />
      ) : (
        <input
          className="admin-field__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      )}
      <div className="admin-cell__actions">
        <button
          className="admin-btn admin-btn--sm admin-btn--primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="admin-btn admin-btn--sm admin-btn--ghost"
          onClick={cancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function WordList({ token, words, loading, error, onChanged }) {
  const [rowError, setRowError] = useState(null) // { id, message }

  const updateField = async (id, field, value) => {
    setRowError(null)
    try {
      await adminApi.update(id, { [field]: value }, token)
      if (onChanged) await onChanged()
    } catch (err) {
      setRowError({ id, message: err.message || 'Update failed' })
      throw err
    }
  }

  const deleteRow = async (row) => {
    setRowError(null)
    const ok = window.confirm(`Delete "${row.chamorro}" (id ${row.id})? This cannot be undone.`)
    if (!ok) return
    try {
      await adminApi.remove(row.id, token)
      if (onChanged) await onChanged()
    } catch (err) {
      setRowError({ id: row.id, message: err.message || 'Delete failed' })
    }
  }

  if (loading) {
    return <p className="admin-card__hint">Loading vocabulary…</p>
  }
  if (error) {
    return <p className="admin-status admin-status--error">{error}</p>
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card__title">All Vocabulary ({words.length})</h2>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>id</th>
              <th>CHamoru</th>
              <th>English</th>
              <th>Category</th>
              <th>Diff.</th>
              <th>Cultural note</th>
              <th>Source</th>
              <th>Verified</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {words.map((row) => (
              <tr key={row.id}>
                <td className="admin-table__id">{row.id}</td>
                <td>{row.chamorro}</td>
                <td>{row.english}</td>
                <td>{row.category || <span className="admin-cell__empty">—</span>}</td>
                <td>{row.difficulty}</td>
                <td>
                  <EditableCell
                    value={row.cultural_note}
                    onSave={(v) => updateField(row.id, 'cultural_note', v)}
                    multiline
                  />
                </td>
                <td>
                  <EditableCell
                    value={row.source}
                    onSave={(v) => updateField(row.id, 'source', v)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={Boolean(row.verified)}
                    onChange={(e) => updateField(row.id, 'verified', e.target.checked)}
                  />
                </td>
                <td>
                  <button
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => deleteRow(row)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {words.length === 0 && (
              <tr>
                <td colSpan={9} className="admin-table__empty">No words yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rowError && (
        <p className="admin-status admin-status--error" role="alert">
          Row {rowError.id}: {rowError.message}
        </p>
      )}
    </section>
  )
}

export default WordList
