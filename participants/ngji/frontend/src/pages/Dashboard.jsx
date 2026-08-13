import { useState, useEffect, useCallback } from 'react'

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default function Dashboard() {
  const [balance, setBalance] = useState({ balance_cents: 0, total_approved: 0, total_declined: 0, total_refunded: 0 })
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    card_number: '', holder_name: '', expiration: '', cvv: '',
    amount: '', installments: '1', description: ''
  })

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/balance')
      if (res.ok) setBalance(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    setLoading(true)
    try {
      const body = {
        card_number: form.card_number,
        holder_name: form.holder_name,
        expiration: form.expiration,
        cvv: form.cvv,
        amount_cents: parseInt(form.amount, 10) || 0,
        installments: parseInt(form.installments, 10) || 1,
        description: form.description,
      }
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.status === 201 && data.status === 'approved') {
        setFeedback({ type: 'success', message: `Transação aprovada! ID: ${data.id}` })
        setForm({ card_number: '', holder_name: '', expiration: '', cvv: '', amount: '', installments: '1', description: '' })
      } else if (res.status === 201 && data.status === 'declined') {
        setFeedback({ type: 'error', message: `Transação recusada. ${data.id ? 'ID: ' + data.id : ''}` })
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao processar pagamento.' })
      }
      fetchBalance()
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Processe pagamentos e acompanhe seu saldo em tempo real</p>
      </div>

      <div className="dashboard-grid">
        {/* Payment Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">💳</div>
            <span className="card-title">Novo Pagamento</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Número do Cartão</label>
                <input
                  type="text"
                  name="card_number"
                  className="form-input input-card-number"
                  placeholder="0000 0000 0000 0000"
                  value={form.card_number}
                  onChange={handleChange}
                  maxLength={16}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Nome do Titular</label>
                <input
                  type="text"
                  name="holder_name"
                  className="form-input input-holder-name"
                  placeholder="Nome impresso no cartão"
                  value={form.holder_name}
                  onChange={handleChange}
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Validade</label>
                <input
                  type="text"
                  name="expiration"
                  className="form-input input-expiration"
                  placeholder="MM/YY"
                  value={form.expiration}
                  onChange={handleChange}
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  className="form-input input-cvv"
                  placeholder="123"
                  value={form.cvv}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valor (centavos)</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input input-amount"
                  placeholder="10000"
                  value={form.amount}
                  onChange={handleChange}
                  min="1"
                  max="1000000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parcelas</label>
                <select
                  name="installments"
                  className="form-select select-installments"
                  value={form.installments}
                  onChange={handleChange}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={String(n)}>
                      {n}x {n === 1 ? '(sem juros)' : n <= 6 ? '(2% a.m.)' : '(4% a.m.)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  name="description"
                  className="form-input input-description"
                  placeholder="Descrição do pagamento"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-pay"
              disabled={loading}
            >
              {loading ? '⏳ Processando...' : '⚡ Pagar'}
            </button>
          </form>

          {feedback && feedback.type === 'success' && (
            <div className="feedback feedback-success">✅ {feedback.message}</div>
          )}
          {feedback && feedback.type === 'error' && (
            <div className="feedback feedback-error">❌ {feedback.message}</div>
          )}
        </div>

        {/* Balance Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📊</div>
            <span className="card-title">Resumo Financeiro</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-label">Saldo Líquido</div>
              <div className="stat-value">
                <span className="display-balance" data-value={balance.balance_cents}>
                  {formatBRL(balance.balance_cents)}
                </span>
              </div>
            </div>
            <div className="stat-card approved">
              <div className="stat-label">Aprovadas</div>
              <div className="stat-value">
                <span className="display-total-approved" data-value={balance.total_approved}>
                  {balance.total_approved}
                </span>
              </div>
            </div>
            <div className="stat-card declined">
              <div className="stat-label">Recusadas</div>
              <div className="stat-value">
                <span className="display-total-declined" data-value={balance.total_declined}>
                  {balance.total_declined}
                </span>
              </div>
            </div>
            <div className="stat-card refunded">
              <div className="stat-label">Estornadas</div>
              <div className="stat-value">
                <span className="display-total-refunded" data-value={balance.total_refunded}>
                  {balance.total_refunded}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
