import { Routes, Route, Link } from 'react-router'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Detail from './pages/Detail.jsx'

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Dashboard</Link>
        {' | '}
        <Link to="/history">Historico</Link>
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/transaction/:id" element={<Detail />} />
      </Routes>
    </div>
  )
}
