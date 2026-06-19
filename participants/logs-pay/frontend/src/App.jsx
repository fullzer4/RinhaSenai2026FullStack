import { Routes, Route, NavLink, useLocation } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

const IconHome = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconHistory = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 0 .5-3.5"/><path d="M3 4v4h4"/>
  </svg>
)

const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#ff1f78"/>
    <path d="M6 12h12M12 6v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

function AppShell() {
  const location = useLocation()

  return (
    <div className="app-container">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo">
          <IconLogo />
          Logs<span>Pay</span>
        </NavLink>

        <nav className="sidebar-menu">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconHome /> Dashboard
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconHistory /> Histórico
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #ff1f78, #ff6eb0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
              LP
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LogsPay</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="animate-in" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/transaction/:id" element={<Detail />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}
