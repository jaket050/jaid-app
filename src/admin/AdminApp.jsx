import './admin.css'
import { useAdminAuth } from './useAdminAuth'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'

function AdminApp() {
  const { token, login, logout } = useAdminAuth()

  if (!token) {
    return <AdminLogin onLogin={login} />
  }
  return <AdminPanel token={token} onLogout={logout} />
}

export default AdminApp
