import { Routes, Route, NavLink } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <nav className="topbar">
        <NavLink className="brand" to="/">Poussin Pay</NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Historico</NavLink>
        </div>
      </nav>
      <main className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/transaction/:id" element={<Detail />} />
        </Routes>
      </main>
    </div>
  )
}
