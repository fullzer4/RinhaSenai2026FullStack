import { Routes, Route, NavLink } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <span className="dot" />
          Pagaro
        </div>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Lançamento
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
            Razão
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/transaction/:id" element={<Detail />} />
      </Routes>
    </div>
  )
}
