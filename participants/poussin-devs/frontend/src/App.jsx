import { Routes, Route, Link } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <nav className="topbar">
        <Link className="brand" to="/">Rinha Pay</Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/history">Historico</Link>
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
