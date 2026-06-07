import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Admin and practice bundles are lazy-loaded so they don't bloat the learner app.
// eslint-disable-next-line react-refresh/only-export-components
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
// eslint-disable-next-line react-refresh/only-export-components
const MatchGame = lazy(() => import('./practice/MatchGame.jsx'))

const path = window.location.pathname.replace(/\/+$/, '')
const isAdmin = path.startsWith('/admin')
const isFamilyMatch = path === '/practice/family'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={<p>Loading admin…</p>}>
        <AdminApp />
      </Suspense>
    ) : isFamilyMatch ? (
      <Suspense fallback={<p>Loading game…</p>}>
        <MatchGame />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
