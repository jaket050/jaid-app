import { useSyncExternalStore } from 'react'

// The theme choice: 'system', 'light' or 'dark', stored in localStorage
// under "jaid-theme" (default 'system'). The inline script in index.html
// applies it before first paint; this module keeps it current afterwards.
// One shared store, so every screen agrees on the choice.

export const THEME_KEY = 'jaid-theme'
export const THEME_CHOICES = ['system', 'light', 'dark']

// Browser chrome color per theme. Matches --bg in src/index.css and the
// colors in the index.html script.
const THEME_COLOR = { light: '#F7FAF9', dark: '#0D2E57' }
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readChoice() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return THEME_CHOICES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function systemTheme() {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export function resolveTheme(choice) {
  return choice === 'system' ? systemTheme() : choice
}

// Applies the theme with no fade: transitions are off for the two frames
// around the change (see [data-theme-switching] in src/index.css).
function applyTheme(theme) {
  const root = document.documentElement
  if (root.dataset.theme === theme) return
  root.setAttribute('data-theme-switching', '')
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  const raf = window.requestAnimationFrame ?? ((fn) => setTimeout(fn, 16))
  raf(() => raf(() => root.removeAttribute('data-theme-switching')))
}

let choice = typeof window === 'undefined' ? 'system' : readChoice()
const subscribers = new Set()
const emit = () => subscribers.forEach((fn) => fn())

export function setThemeChoice(next) {
  if (!THEME_CHOICES.includes(next)) return
  choice = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    // Storage unavailable (private mode): the choice lasts for this visit.
  }
  applyTheme(resolveTheme(next))
  emit()
}

let started = false

// Called once from main.jsx, so every screen stays in step: while the
// choice is System, an OS light or dark change applies live, and a choice
// made in another tab is picked up here too.
export function startThemeSync() {
  if (started || typeof window === 'undefined') return
  started = true
  applyTheme(resolveTheme(choice))
  window.matchMedia?.(DARK_QUERY).addEventListener('change', () => {
    if (choice === 'system') applyTheme(systemTheme())
  })
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_KEY) return
    choice = readChoice()
    applyTheme(resolveTheme(choice))
    emit()
  })
}

function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

// { choice, setChoice } for the toggle. The choice is shared by every
// component using this hook.
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => choice, () => 'system')
  return { choice: current, setChoice: setThemeChoice }
}
