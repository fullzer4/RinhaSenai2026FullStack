import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setBusy(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Erro ao cadastrar'); setBusy(false); return }
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
        <div className="auth-title">Criar sua conta</div>

        <form onSubmit={submit}>
          <div className="form-row single">
            <div className="field">
              <label>Nome</label>
              <input
                className="input-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                maxLength={80}
                required
              />
            </div>
          </div>

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

          <div className="form-row">
            <div className="field">
              <label>Senha</label>
              <input
                className="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                required
              />
            </div>
            <div className="field">
              <label>Confirmar senha</label>
              <input
                className="input-password-confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
              />
            </div>
          </div>

          {error && <div className="feedback-error" style={{ marginBottom: 14 }}>{error}</div>}

          <button className="btn-pay" type="submit" disabled={busy}>
            {busy ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  )
}
