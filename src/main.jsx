import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Admin and practice bundles are lazy-loaded so they don't bloat the learner app.
// eslint-disable-next-line react-refresh/only-export-components
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
// eslint-disable-next-line react-refresh/only-export-components
const MatchGame = lazy(() => import('./practice/MatchGame.jsx'))
// eslint-disable-next-line react-refresh/only-export-components
const MatchModeSelect = lazy(() => import('./practice/MatchModeSelect.jsx'))
// eslint-disable-next-line react-refresh/only-export-components
const MunicipalityGame = lazy(() => import('./practice/MunicipalityGame.jsx'))

const path = window.location.pathname.replace(/\/+$/, '')
const isAdmin = path.startsWith('/admin')
const isPractice = path.startsWith('/practice')
// practiceSlug: '' = mode selector, 'family'|'weather'|'food'|'antonyms' = specific game
const practiceSlug = isPractice ? path.slice('/practice'.length).replace(/^\//, '') : ''

// '/practice/family' existed before the mode selector — treat it as 'kinship'.
const practiceMode = practiceSlug === 'family' ? 'kinship' : practiceSlug

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={<p>Loading admin…</p>}>
        <AdminApp />
      </Suspense>
    ) : isPractice && practiceMode === 'map' ? (
      <Suspense fallback={<p>Loading game…</p>}>
        <MunicipalityGame />
      </Suspense>
    ) : isPractice && practiceMode ? (
      <Suspense fallback={<p>Loading game…</p>}>
        <MatchGame mode={practiceMode} />
      </Suspense>
    ) : isPractice ? (
      <Suspense fallback={<p>Loading…</p>}>
        <MatchModeSelect />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
