import { useMemo, useState } from 'react'
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

function EditingRow({ row, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    chamorro: row.chamorro || '',
    english: row.english || '',
    type: row.type || 'word',
    difficulty: row.difficulty || 1,
    category: row.category || '',
    cultural_note: row.cultural_note || '',
    source: row.source || '',
    verified: Boolean(row.verified),
  })
  const [usingNewCategory, setUsingNewCategory] = useState(
    Boolean(row.category) && !categories.includes(row.category)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = async () => {
    setError(null)
    if (!form.chamorro.trim() || !form.english.trim()) {
      setError('CHamoru and English are required.')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="admin-row-editor-row">
      <td colSpan={9}>
        <div className="admin-row-editor">
          <div className="admin-row-editor__title">Editing row {row.id}</div>
          <div className="admin-row-editor__grid">
            <label className="admin-field">
              <span className="admin-field__label">CHamoru *</span>
              <input
                className="admin-field__input"
                value={form.chamorro}
                onChange={(e) => update({ chamorro: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field__label">English *</span>
              <input
                className="admin-field__input"
                value={form.english}
                onChange={(e) => update({ english: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Type</span>
              <select
                className="admin-field__input"
                value={form.type}
                onChange={(e) => update({ type: e.target.value })}
              >
                <option value="word">Word</option>
                <option value="phrase">Phrase</option>
                <option value="saying">Saying</option>
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Difficulty</span>
              <select
                className="admin-field__input"
                value={form.difficulty}
                onChange={(e) => update({ difficulty: parseInt(e.target.value, 10) })}
              >
                <option value={1}>1 — Beginner</option>
                <option value={2}>2 — Intermediate</option>
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Category</span>
              {usingNewCategory ? (
                <input
                  className="admin-field__input"
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                  placeholder="new category"
                />
              ) : (
                <select
                  className="admin-field__input"
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                >
                  <option value="">— none —</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="admin-link"
                onClick={() => setUsingNewCategory((v) => !v)}
              >
                {usingNewCategory ? 'Choose existing' : 'Add new category'}
              </button>
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Source</span>
              <input
                className="admin-field__input"
                value={form.source}
                onChange={(e) => update({ source: e.target.value })}
              />
            </label>
            <label className="admin-field admin-row-editor__full">
              <span className="admin-field__label">Cultural note</span>
              <textarea
                className="admin-field__input admin-field__input--textarea"
                value={form.cultural_note}
                onChange={(e) => update({ cultural_note: e.target.value })}
                rows={2}
              />
            </label>
            <label className="admin-checkbox admin-row-editor__full">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => update({ verified: e.target.checked })}
              />
              <span>Verified</span>
            </label>
          </div>
          {error && (
            <p className="admin-status admin-status--error" role="alert">{error}</p>
          )}
          <div className="admin-row-editor__actions">
            <button
              className="admin-btn admin-btn--primary admin-btn--sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

function WordList({ token, words, categories, loading, error, onChanged }) {
  const [rowError, setRowError] = useState(null) // { id, message }
  const [editingId, setEditingId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')

  const visibleWords = useMemo(() => {
    if (!categoryFilter) return words
    return words.filter((w) => w.category === categoryFilter)
  }, [words, categoryFilter])

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
      <div className="admin-list-toolbar">
        <h2 className="admin-card__title">
          {categoryFilter ? `${categoryFilter} (${visibleWords.length})` : `All Vocabulary (${visibleWords.length})`}
        </h2>
        <label className="admin-field admin-list-toolbar__filter">
          <span className="admin-field__label">Category</span>
          <select
            className="admin-field__input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
      </div>

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
            {visibleWords.map((row) =>
              editingId === row.id ? (
                <EditingRow
                  key={row.id}
                  row={row}
                  categories={categories}
                  onSave={async (form) => {
                    await adminApi.update(row.id, form, token)
                    setEditingId(null)
                    if (onChanged) await onChanged()
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
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
                    <div className="admin-cell__actions">
                      <button
                        className="admin-btn admin-btn--sm admin-btn--ghost"
                        onClick={() => setEditingId(row.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => deleteRow(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {visibleWords.length === 0 && (
              <tr>
                <td colSpan={9} className="admin-table__empty">
                  {categoryFilter ? `No words in "${categoryFilter}".` : 'No words yet.'}
                </td>
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
