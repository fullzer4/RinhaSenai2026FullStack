import { Routes, Route, NavLink } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'
import './styles/app.css'

export default function App() {
  return (
    <div className="app-container">
      <nav className="app-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
          Histórico
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/transaction/:id" element={<Detail />} />
      </Routes>
    </div>
  )
}