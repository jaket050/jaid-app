import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'

const CHAMORU_CHARS = [
  { char: 'á', label: 'á' },
  { char: 'Á', label: 'Á' },
  { char: 'å', label: 'å' },
  { char: 'Å', label: 'Å' },
  { char: 'ǻ', label: 'ǻ' },
  { char: 'Ǻ', label: 'Ǻ' },
  { char: 'é', label: 'é' },
  { char: 'É', label: 'É' },
  { char: 'í', label: 'í' },
  { char: 'Í', label: 'Í' },
  { char: 'ó', label: 'ó' },
  { char: 'Ó', label: 'Ó' },
  { char: 'ú', label: 'ú' },
  { char: 'Ú', label: 'Ú' },
  { char: 'ch', label: 'ch' },
  { char: 'CH', label: 'CH' },
  { char: 'ñ', label: 'ñ' },
  { char: 'Ñ', label: 'Ñ' },
  { char: 'ng', label: 'ng' },
  { char: 'NG', label: 'NG' },
  { char: "'", label: "Glota" },
]

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(
    window.innerWidth <= 768
  )
  const inputRef = useRef(null)

  const handleInput = (value) => {
    setQuery(value)
    onSearch(value)
  }

  const insertChar = (char) => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const newValue = query.slice(0, start) + char + query.slice(end)
    setQuery(newValue)
    onSearch(newValue)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + char.length, start + char.length)
    }, 0)
  }

  const clearSearch = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="search-bar">
      <div className="search-bar__input-row">
        <Search size={16} className="search-bar__icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="Search in CHamoru or English..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setShowKeyboard(true)}
          onBlur={() => {
            if (window.innerWidth > 768) {
              setTimeout(() => setShowKeyboard(false), 200)
            }
          }}
        />
        {query && (
          <button className="search-bar__clear" onClick={clearSearch}>
            <X size={14} />
          </button>
        )}
      </div>

      {showKeyboard && (
        <div className="search-bar__keyboard">
          <span className="search-bar__keyboard-label">
            CHamoru characters
          </span>
          <div className="search-bar__keys">
            {CHAMORU_CHARS.map((item) => (
              <button
                key={item.char}
                className="search-bar__key"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertChar(item.char)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
