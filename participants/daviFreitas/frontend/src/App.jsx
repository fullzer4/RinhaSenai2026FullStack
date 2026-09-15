// App - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 9: rotas do SPA. O fallback de servidor (backend/src/server.js) já
// devolve index.html para qualquer rota fora de /api/*, então recarregar a
// página em /history ou /transaction/:id funciona normalmente.

import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';
import TransactionDetail from './pages/TransactionDetail.jsx';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Rinha FullStack SENAI 2026 — davidefreitas
        </Link>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/history">Histórico</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/transaction/:id" element={<TransactionDetail />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>
    </div>
  );
}
