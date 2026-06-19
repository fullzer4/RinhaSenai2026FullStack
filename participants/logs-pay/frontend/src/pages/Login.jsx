import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    await new Promise(r => setTimeout(r, 800))
    
    if (isRegister) {
      if (form.password !== form.confirmPassword) {
        setError('As senhas não coincidem.')
        setLoading(false)
        return
      }
      // Simula registro de conta com sucesso
      localStorage.setItem('lp_auth', '1')
      navigate('/')
    } else {
      if (form.email && form.password) {
        localStorage.setItem('lp_auth', '1')
        navigate('/')
      } else {
        setError('Preencha e-mail e senha para continuar.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-layout">
      {/* Left: Form */}
      <div className="login-form-side">
        <div className="login-form-inner">
          {/* Logo */}
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#ff1f78"/>
              <path d="M6 12h12M12 6v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>Logs<span style={{ color: 'var(--neon-green)' }}>Pay</span></span>
          </div>

          <h1 className="login-title">
            {isRegister ? 'Crie sua conta' : 'Entrar na sua conta'}
          </h1>
          <p className="login-subtitle">
            {isRegister ? 'Preencha os dados para se cadastrar' : 'Insira seus dados abaixo para acessar o painel'}
          </p>

          {error && (
            <div className="feedback-msg feedback-error" style={{ marginTop: '1rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>E-mail</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="Digite seu e-mail"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: isRegister ? '1.25rem' : '0.5rem' }}>
              <label>Senha</label>
              <input
                id="login-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Digite sua senha"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {isRegister && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Confirmar Senha</label>
                <input
                  id="login-confirm-password"
                  name="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Confirme sua senha"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {!isRegister && (
              <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                <a href="#" style={{ color: 'var(--neon-green)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500 }}>
                  Esqueceu sua senha?
                </a>
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              {loading ? 'Processando...' : (isRegister ? 'Cadastrar e Entrar' : 'Entrar')}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setError('')
                setIsRegister(!isRegister)
              }}
              style={{ color: 'var(--neon-green)', fontWeight: 600, textDecoration: 'none' }}
            >
              {isRegister ? 'Entre aqui' : 'Cadastre-se'}
            </a>
          </p>
        </div>
      </div>

      {/* Right: Visual Panel */}
      <div className="login-visual-side">
        <div className="login-visual-content">
          <div className="login-visual-badge">Gateway de Pagamentos</div>
          <h2 className="login-visual-title">
            Processe pagamentos<br/>
            com <span style={{ color: 'var(--neon-green)' }}>velocidade</span> e<br/>
            <span style={{ color: 'var(--neon-green)' }}>segurança</span>
          </h2>
          <p className="login-visual-text">
            Gerencie transações, controle estornos e acompanhe seu saldo em tempo real.
          </p>

          <div className="login-stats-row">
            <div className="login-stat">
              <span className="login-stat-value">99.9%</span>
              <span className="login-stat-label">Uptime</span>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <span className="login-stat-value">&lt; 80ms</span>
              <span className="login-stat-label">Latência</span>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <span className="login-stat-value">12</span>
              <span className="login-stat-label">Bandeiras</span>
            </div>
          </div>

          {/* Fake chart bars */}
          <div className="login-chart">
            {[40, 65, 55, 80, 70, 95, 85].map((h, i) => (
              <div key={i} className="login-bar-wrap">
                <div
                  className="login-bar"
                  style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.4 + i * 0.08 }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
