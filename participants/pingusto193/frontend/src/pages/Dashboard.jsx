import { useState, useEffect, useCallback } from 'react'
import { getBalance, createTransaction, formatCents } from '../api.js'

const INITIAL_FORM = {
  cardNumber: '',
  holderName: '',
  expiration: '',
  cvv: '',
  amount: '',
  installments: 1,
  description: '',
}

export default function Dashboard() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [feedback, setFeedback] = useState(null)
  const [balance, setBalance] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadBalance = useCallback(() => {
    getBalance().then((r) => { if (r.ok) setBalance(r.data) })
  }, [])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    const payload = {
      card_number: form.cardNumber.trim(),
      holder_name: form.holderName.trim(),
      expiration: form.expiration.trim(),
      cvv: form.cvv.trim(),
      amount_cents: Math.round(Number(form.amount)),
      installments: Number(form.installments),
      description: form.description.trim(),
      idempotency_key: crypto.randomUUID(),
    }

    try {
      const r = await createTransaction(payload)
      if (r.ok && r.data?.status === 'approved') {
        setFeedback({ type: 'success', message: `Pagamento aprovado! ${formatCents(r.data.net_amount)} liquidos.` })
        setForm(INITIAL_FORM)
      } else if (r.ok && r.data?.status === 'declined') {
        setFeedback({ type: 'error', message: 'Pagamento recusado pelo emissor do cartao.' })
      } else {
        setFeedback({ type: 'error', message: r.data?.error ?? `Erro ${r.status}` })
      }
      loadBalance()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>Gateway de Pagamento</h1>

      {balance && (
        <section className="card">
          <h2>Saldo</h2>
          <div className="balance-grid">
            <div className="balance-item">
              <span className="label">Saldo liquido</span>
              <span className="display-balance" data-value={balance.balance_cents}>
                {formatCents(balance.balance_cents)}
              </span>
            </div>
            <div className="balance-item">
              <span className="label">Aprovadas</span>
              <span className="display-total-approved" data-value={balance.total_approved}>{balance.total_approved}</span>
            </div>
            <div className="balance-item">
              <span className="label">Recusadas</span>
              <span className="display-total-declined" data-value={balance.total_declined}>{balance.total_declined}</span>
            </div>
            <div className="balance-item">
              <span className="label">Estornadas</span>
              <span className="display-total-refunded" data-value={balance.total_refunded}>{balance.total_refunded}</span>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Novo pagamento</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Numero do cartao
            <input
              className="input-card-number"
              value={form.cardNumber}
              onChange={(e) => updateField('cardNumber', e.target.value)}
              maxLength={16}
              required
            />
          </label>
          <label>
            Nome do titular
            <input
              className="input-holder-name"
              value={form.holderName}
              onChange={(e) => updateField('holderName', e.target.value)}
              maxLength={50}
              required
            />
          </label>
          <label>
            Validade (MM/YY)
            <input
              className="input-expiration"
              value={form.expiration}
              onChange={(e) => updateField('expiration', e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </label>
          <label>
            CVV
            <input
              className="input-cvv"
              value={form.cvv}
              onChange={(e) => updateField('cvv', e.target.value)}
              maxLength={4}
              required
            />
          </label>
          <label>
            Valor (centavos)
            <input
              className="input-amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              required
            />
          </label>
          <label>
            Parcelas
            <select
              className="select-installments"
              value={form.installments}
              onChange={(e) => updateField('installments', e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </label>
          <label>
            Descricao
            <input
              className="input-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <button type="submit" className="btn-pay" disabled={submitting}>
            {submitting ? 'Processando...' : 'Pagar'}
          </button>
        </form>

        {feedback?.type === 'success' && <p className="feedback-success">{feedback.message}</p>}
        {feedback?.type === 'error' && <p className="feedback-error">{feedback.message}</p>}
      </section>
    </div>
  )
}
