import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Erro ao entrar'); setBusy(false); return }
      login(d.token, d.user)
      navigate('/')
    } catch {
      setError('Erro de conexão.')
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">QuebraBanca</div>
        <div className="auth-title">Entrar na sua conta</div>

        <form onSubmit={submit}>
          <div className="form-row single">
            <div className="field">
              <label>E-mail</label>
              <input
                className="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="form-row single">
            <div className="field">
              <label>Senha</label>
              <input
                className="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <div className="feedback-error" style={{ marginBottom: 14 }}>{error}</div>}

          <button className="btn-pay" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="auth-switch">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </div>
      </div>
    </div>
  )
}
