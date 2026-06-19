import { useState, useEffect } from 'react'

const initialForm = {
  card_number: '',
  holder_name: '',
  expiration: '',
  cvv: '',
  amount_cents: '',
  installments: '1',
  description: '',
}

const emptyBalance = {
  balance_cents: 0,
  total_approved: 0,
  total_declined: 0,
  total_refunded: 0,
}

function money(cents) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2)}`
}

export default function Dashboard() {
  const [form, setForm] = useState(initialForm)
  const [feedback, setFeedback] = useState(null)
  const [balance, setBalance] = useState(emptyBalance)
  const [loading, setLoading] = useState(false)

  async function loadBalance() {
    const res = await fetch('/api/balance')
    if (res.ok) setBalance(await res.json())
  }

  useEffect(() => {
    loadBalance()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const body = {
      ...form,
      amount_cents: Number(form.amount_cents),
      installments: Number(form.installments),
      idempotency_key: `front-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok && data.status === 'approved') {
        setFeedback({ type: 'success', message: 'Transacao aprovada' })
        setForm(initialForm)
      } else {
        setFeedback({ type: 'error', message: data.error || 'Transacao recusada' })
      }
      await loadBalance()
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao enviar pagamento' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Gateway de Pagamento</h1>

      <form onSubmit={submit}>
        <input className="input-card-number" name="card_number" value={form.card_number} onChange={updateField} placeholder="Numero do cartao" />
        <input className="input-holder-name" name="holder_name" value={form.holder_name} onChange={updateField} placeholder="Nome do titular" />
        <input className="input-expiration" name="expiration" value={form.expiration} onChange={updateField} placeholder="MM/YY" />
        <input className="input-cvv" name="cvv" value={form.cvv} onChange={updateField} placeholder="CVV" />
        <input className="input-amount" name="amount_cents" value={form.amount_cents} onChange={updateField} placeholder="Valor em centavos" type="number" />
        <select className="select-installments" name="installments" value={form.installments} onChange={updateField}>
          {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => (
            <option key={value} value={value}>{value}x</option>
          ))}
        </select>
        <input className="input-description" name="description" value={form.description} onChange={updateField} placeholder="Descricao" />
        <button className="btn-pay" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Pagar'}</button>
      </form>

      {feedback?.type === 'success' && <p className="feedback-success">{feedback.message}</p>}
      {feedback?.type === 'error' && <p className="feedback-error">{feedback.message}</p>}

      <section>
        <p>Saldo liquido: <span className="display-balance" data-value={balance.balance_cents}>{money(balance.balance_cents)}</span></p>
        <p>Aprovadas: <span className="display-total-approved" data-value={balance.total_approved}>{balance.total_approved}</span></p>
        <p>Recusadas: <span className="display-total-declined" data-value={balance.total_declined}>{balance.total_declined}</span></p>
        <p>Estornadas: <span className="display-total-refunded" data-value={balance.total_refunded}>{balance.total_refunded}</span></p>
      </section>
    </div>
  )
}
