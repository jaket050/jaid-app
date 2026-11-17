import { useRef } from 'react'
import { THEME_CHOICES, useTheme } from '../hooks/useTheme'

// Inline icons, drawn with the current text color.
function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20h8M12 16v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function LightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DarkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const OPTIONS = {
  system: { label: 'System', Icon: SystemIcon },
  light: { label: 'Light', Icon: LightIcon },
  dark: { label: 'Dark', Icon: DarkIcon },
}

// System, Light, Dark as a radio group: one Tab stop, arrow keys move and
// choose (Home and End jump to the ends).
function ThemeToggle() {
  const { choice, setChoice } = useTheme()
  const refs = useRef({})

  function onKeyDown(e) {
    const i = THEME_CHOICES.indexOf(choice)
    const n = THEME_CHOICES.length
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = THEME_CHOICES[(i + 1) % n]
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = THEME_CHOICES[(i - 1 + n) % n]
    else if (e.key === 'Home') next = THEME_CHOICES[0]
    else if (e.key === 'End') next = THEME_CHOICES[n - 1]
    if (!next) return
    e.preventDefault()
    setChoice(next)
    refs.current[next]?.focus()
  }

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme" onKeyDown={onKeyDown}>
      {THEME_CHOICES.map((value) => {
        const { label, Icon } = OPTIONS[value]
        const checked = choice === value
        return (
          <button
            key={value}
            ref={(el) => { refs.current[value] = el }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            tabIndex={checked ? 0 : -1}
            className="theme-toggle__option"
            onClick={() => setChoice(value)}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle
