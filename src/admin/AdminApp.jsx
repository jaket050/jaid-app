import './admin.css'
import { useAdminAuth } from './useAdminAuth'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'
import AdminCoverage from './AdminCoverage'

function AdminApp() {
  const { token, login, logout } = useAdminAuth()

  if (!token) {
    return <AdminLogin onLogin={login} />
  }

  // Sub-routing within /admin without pulling in a router lib.
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path === '/admin/coverage') {
    return <AdminCoverage token={token} onExit={logout} />
  }
  return <AdminPanel token={token} onLogout={logout} />
}

export default AdminApp
