import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import TransactionDetail from './pages/TransactionDetail';
import './styles/App.css';

export default function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />

         <div className="header-content">
            <img src="/imagemsecret.jpeg" alt="Avatar" className="header-avatar" />
          <div className="header-text">
            <h1>Bem-vindo ao Sistema de Pagamento</h1>
            <p>Gerencie suas transações e saldo de forma simples e segura.</p>
          </div>
        </div>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/transaction/:id" element={<TransactionDetail />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2026 Rinha | Gateway</p>
        </footer>
      </div>
    </Router>
  );
}