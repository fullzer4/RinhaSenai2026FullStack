import { useState, useEffect } from 'react'
import { apiUrl } from '../api.js'

function money(cents = 0) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const [balance, setBalance] = useState({
    balance_cents: 0,
    total_approved: 0,
    total_declined: 0,
    total_refunded: 0
  })
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadBalance() {
    const res = await fetch(apiUrl('/api/balance'))
    if (res.ok) setBalance(await res.json())
  }

  useEffect(() => {
    loadBalance()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const paymentForm = event.currentTarget
    const form = new FormData(paymentForm)
    const payload = {
      card_number: String(form.get('card_number') || '').replace(/\D/g, ''),
      holder_name: String(form.get('holder_name') || ''),
      expiration: String(form.get('expiration') || ''),
      cvv: String(form.get('cvv') || '').replace(/\D/g, ''),
      amount_cents: Number(form.get('amount_cents')),
      installments: Number(form.get('installments') || 1),
      description: String(form.get('description') || '')
    }

    try {
      const res = await fetch(apiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.status === 'approved') {
        setFeedback({ type: 'success', message: 'Transacao aprovada!' })
        paymentForm.reset()
      } else if (res.ok && data.status === 'declined') {
        setFeedback({ type: 'error', message: 'Transacao recusada.' })
      } else {
        setFeedback({ type: 'error', message: data.error || data.errors?.join(', ') || 'Erro na transacao.' })
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error)
      setFeedback({ type: 'error', message: 'Erro de conexao.' })
    } finally {
      await loadBalance()
      setLoading(false)
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Gateway fake</p>
          <h1>Operacao de pagamento</h1>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>Novo pagamento</h2>
            </div>
          </div>
          <form className="payment-form" onSubmit={handleSubmit}>
            <div className="form-field full">
              <label htmlFor="card_number">Numero do cartao</label>
              <input id="card_number" className="input-card-number" name="card_number" inputMode="numeric" autoComplete="cc-number" maxLength="19" placeholder="4111 1111 1111 1111" required />
            </div>
            <div className="form-field">
              <label htmlFor="holder_name">Nome do titular</label>
              <input id="holder_name" className="input-holder-name" name="holder_name" autoComplete="cc-name" maxLength="50" placeholder="Joao Silva" required />
            </div>
            <div className="form-field">
              <label htmlFor="expiration">Validade</label>
              <input id="expiration" className="input-expiration" name="expiration" autoComplete="cc-exp" placeholder="MM/YY" maxLength="5" required />
            </div>
            <div className="form-field">
              <label htmlFor="cvv">CVV</label>
              <input id="cvv" className="input-cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength="4" placeholder="123" required />
            </div>
            <div className="form-field">
              <label htmlFor="amount_cents">Valor em centavos</label>
              <input id="amount_cents" className="input-amount" name="amount_cents" type="number" min="1" max="1000000" placeholder="10000" required />
            </div>
            <div className="form-field">
              <label htmlFor="installments">Parcelas</label>
              <select id="installments" className="select-installments" name="installments" defaultValue="1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={String(n)}>{n}x</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="description">Descricao</label>
              <input id="description" className="input-description" name="description" maxLength="100" placeholder="Compra SENAI" required />
            </div>
            <button className="btn-pay" type="submit" disabled={loading}>{loading ? 'Processando...' : 'Pagar agora'}</button>
          </form>

          {feedback?.type === 'success' && <p className="feedback-success" role="status" aria-live="polite">{feedback.message}</p>}
          {feedback?.type === 'error' && <p className="feedback-error" role="alert">{feedback.message}</p>}
        </section>

        <section className="panel balance-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Caixa</p>
              <h2>Saldo</h2>
            </div>
          </div>
          <div className="balance-list">
            <p className="balance-row balance-main"><span>Saldo liquido</span><span className="display-balance" data-value={balance.balance_cents}>{money(balance.balance_cents)}</span></p>
            <p className="balance-row"><span>Aprovadas</span><span className="display-total-approved" data-value={balance.total_approved}>{balance.total_approved}</span></p>
            <p className="balance-row"><span>Recusadas</span><span className="display-total-declined" data-value={balance.total_declined}>{balance.total_declined}</span></p>
            <p className="balance-row"><span>Estornadas</span><span className="display-total-refunded" data-value={balance.total_refunded}>{balance.total_refunded}</span></p>
          </div>
        </section>
      </div>
    </div>
  )
}
