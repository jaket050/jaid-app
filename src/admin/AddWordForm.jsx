import { useState } from 'react'
import { adminApi } from './adminApi'

const TYPE_OPTIONS = [
  { value: 'word', label: 'Word' },
  { value: 'phrase', label: 'Phrase' },
  { value: 'saying', label: 'Saying' },
]

const DIFFICULTY_OPTIONS = [
  { value: 1, label: '1 — Beginner' },
  { value: 2, label: '2 — Intermediate' },
]

const DEFAULT_SOURCE = "Kumision i Fino' CHamoru 2025"

const blankForm = {
  chamorro: '',
  english: '',
  type: 'word',
  difficulty: 1,
  category: '',
  newCategory: '',
  cultural_note: '',
  source: DEFAULT_SOURCE,
  verified: true,
}

function AddWordForm({ token, categories, onAdded }) {
  const [form, setForm] = useState(blankForm)
  const [usingNewCategory, setUsingNewCategory] = useState(false)
  const [status, setStatus] = useState(null) // { kind: 'success' | 'error', text }
  const [submitting, setSubmitting] = useState(false)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    const category = usingNewCategory
      ? form.newCategory.trim()
      : form.category.trim()

    if (!form.chamorro.trim() || !form.english.trim()) {
      setStatus({ kind: 'error', text: 'Chamorro and English are required.' })
      return
    }
    if (!category) {
      setStatus({ kind: 'error', text: 'Pick or type a category.' })
      return
    }

    const payload = {
      chamorro: form.chamorro,
      english: form.english,
      type: form.type,
      difficulty: form.difficulty,
      category,
      cultural_note: form.cultural_note,
      source: form.source,
      verified: form.verified,
    }

    setSubmitting(true)
    try {
      const word = await adminApi.add(payload, token)
      setStatus({ kind: 'success', text: `Added "${word.chamorro}" (id ${word.id}).` })
      setForm({ ...blankForm, source: form.source }) // preserve source for next entry
      setUsingNewCategory(false)
      if (onAdded) onAdded(word)
    } catch (err) {
      setStatus({ kind: 'error', text: err.message || 'Failed to add word.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card__title">Add a Word</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__row admin-form__row--2">
          <label className="admin-field">
            <span className="admin-field__label">CHamoru *</span>
            <input
              className="admin-field__input"
              value={form.chamorro}
              onChange={(e) => update({ chamorro: e.target.value })}
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-field__label">English *</span>
            <input
              className="admin-field__input"
              value={form.english}
              onChange={(e) => update({ english: e.target.value })}
              required
            />
          </label>
        </div>

        <div className="admin-form__row admin-form__row--2">
          <label className="admin-field">
            <span className="admin-field__label">Type</span>
            <select
              className="admin-field__input"
              value={form.type}
              onChange={(e) => update({ type: e.target.value })}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-field__label">Difficulty</span>
            <select
              className="admin-field__input"
              value={form.difficulty}
              onChange={(e) => update({ difficulty: parseInt(e.target.value, 10) })}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-form__row admin-form__row--2">
          <label className="admin-field">
            <span className="admin-field__label">Category *</span>
            {usingNewCategory ? (
              <input
                className="admin-field__input"
                value={form.newCategory}
                onChange={(e) => update({ newCategory: e.target.value })}
                placeholder="e.g. weather"
              />
            ) : (
              <select
                className="admin-field__input"
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
              >
                <option value="">— select —</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="admin-link"
              onClick={() => {
                setUsingNewCategory((v) => !v)
                update({ category: '', newCategory: '' })
              }}
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
        </div>

        <label className="admin-field">
          <span className="admin-field__label">Cultural note (optional)</span>
          <textarea
            className="admin-field__input admin-field__input--textarea"
            value={form.cultural_note}
            onChange={(e) => update({ cultural_note: e.target.value })}
            rows={3}
          />
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(e) => update({ verified: e.target.checked })}
          />
          <span>Verified (admin attests the entry is correct)</span>
        </label>

        <div className="admin-form__actions">
          <button
            className="admin-btn admin-btn--primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Add word'}
          </button>
          {status && (
            <span
              className={`admin-status admin-status--${status.kind}`}
              role={status.kind === 'error' ? 'alert' : 'status'}
            >
              {status.text}
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

export default AddWordForm
