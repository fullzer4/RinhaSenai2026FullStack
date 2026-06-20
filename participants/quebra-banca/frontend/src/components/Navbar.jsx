import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav>
      <Link to="/" className="nav-logo">QuebraBanca</Link>
      <Link to="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link>
      <Link to="/checkout" className={pathname === '/checkout' ? 'active' : ''}>Checkout</Link>
      <Link to="/history" className={pathname.startsWith('/history') || pathname.startsWith('/transaction') ? 'active' : ''}>Histórico</Link>
      {user && (
        <div className="nav-user">
          <span className="nav-user-name">{user.name}</span>
          <button className="btn-ghost" onClick={handleLogout}>Sair</button>
        </div>
      )}
    </nav>
  )
}
