import { Link } from 'react-router'

export default function Inicio() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Início</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Welcome Hero banner */}
        <div className="glass-panel" style={{
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(255, 31, 120, 0.05) 0%, rgba(255, 110, 176, 0.05) 100%)',
          border: '1px solid rgba(255, 31, 120, 0.15)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Bem-vindo ao Logs<span style={{ color: 'var(--neon-green)' }}>Pay</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', lineHeight: '1.6' }}>
              Seu painel administrativo para simulação de pagamentos. Crie transações teste, visualize o histórico e consulte dados em tempo real.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Nova Transação
            </Link>
            <Link to="/history" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Ver Histórico
            </Link>
          </div>
        </div>

        {/* Integration tips and cards info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Card 1: Cards recomendados */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'flex', background: 'rgba(255, 31, 120, 0.1)', padding: '6px', borderRadius: '8px', color: 'var(--neon-green)' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect width="22" height="16" x="1" y="4" rx="3"/><path d="M1 10h22"/>
                </svg>
              </span>
              Cartões para Teste
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Para simular transações com sucesso, use números de cartões com os primeiros dígitos válidos correspondentes:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Visa (inicia com 4)</strong> <span>4111 2312 ...</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Mastercard (inicia com 5)</strong> <span>5111 2312 ...</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Amex (inicia com 3)</strong> <span>3111 2312 ...</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Elo (inicia com 6)</strong> <span>6111 2312 ...</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Status do Gateway */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'flex', background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '8px', color: '#10b981' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </span>
              Status do Gateway
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              O sistema está totalmente conectado e pronto para processar transações locais:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span>Banco de Dados (PostgreSQL)</span>
                <span className="badge badge-approved" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Conectado</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span>Servidor Backend (Porta 3000)</span>
                <span className="badge badge-approved" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span>Ambiente</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Desenvolvimento (Local)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
