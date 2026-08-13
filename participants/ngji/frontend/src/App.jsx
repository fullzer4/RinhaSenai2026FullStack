import { Routes, Route, Link, useLocation } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  const location = useLocation()

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <span className="nav-brand">⚡ PayGate</span>
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link${location.pathname === '/' ? ' active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/history"
              className={`nav-link${location.pathname.startsWith('/history') ? ' active' : ''}`}
            >
              Histórico
            </Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/transaction/:id" element={<Detail />} />
      </Routes>
    </>
  )
}
