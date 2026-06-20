import { useState, useEffect, useCallback } from 'react'
import { api, formatCents } from '../lib/api.js'

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

const initialForm = {
  card_number: '',
  holder_name: '',
  expiration: '',
  cvv: '',
  amount_cents: '',
  installments: '1',
  description: '',
}

function detectBrandLabel(cardNumber) {
  const first = cardNumber[0]
  if (first === '4') return 'visa'
  if (first === '5') return 'mastercard'
  if (first === '3') return 'amex'
  if (first === '6') return 'elo'
  return '----'
}

export default function Dashboard() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message }
  const [balance, setBalance] = useState(null)

  const loadBalance = useCallback(async () => {
    const r = await api.get('/balance')
    if (r.ok) setBalance(r.data)
  }, [])

  useEffect(() => { loadBalance() }, [loadBalance])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    const payload = {
      card_number: form.card_number.trim(),
      holder_name: form.holder_name.trim(),
      expiration: form.expiration.trim(),
      cvv: form.cvv.trim(),
      amount_cents: parseInt(form.amount_cents, 10),
      installments: parseInt(form.installments, 10) || 1,
      description: form.description.trim(),
      idempotency_key: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }

    try {
      const r = await api.post('/transactions', payload)

      if (r.status === 422) {
        const detail = Array.isArray(r.data?.details) ? r.data.details.join(', ') : (r.data?.error || 'dados invalidos')
        setFeedback({ type: 'error', message: `Transação rejeitada: ${detail}` })
      } else if (r.status === 201 || r.status === 200) {
        if (r.data?.status === 'approved') {
          setFeedback({
            type: 'success',
            message: `Pagamento aprovado! ${formatCents(r.data.net_amount)} líquidos (taxa ${formatCents(r.data.fee_cents)}).`,
          })
          setForm(initialForm)
        } else {
          setFeedback({ type: 'error', message: 'Pagamento recusado pelo emissor do cartão.' })
        }
        loadBalance()
      } else {
        setFeedback({ type: 'error', message: 'Erro inesperado ao processar pagamento.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha de comunicação com o servidor.' })
    } finally {
      setSubmitting(false)
    }
  }

  const brand = detectBrandLabel(form.card_number)

  return (
    <div>
      <h1>Novo lançamento</h1>
      <p className="page-subtitle">Registre uma cobrança simulada e veja o saldo do caixa se atualizar.</p>

      <div className="dashboard-grid">
        <div>
          <div className="card-visual">
            <div className="card-visual-top">
              <div className="card-chip" />
              <span className="card-brand-tag">{brand}</span>
            </div>
            <div className="card-number-display">
              {form.card_number
                ? form.card_number.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
                : '•••• •••• •••• ••••'}
            </div>
            <div className="card-visual-bottom">
              <span className="card-holder-display">{form.holder_name || 'NOME DO TITULAR'}</span>
              <span className="card-exp-display">{form.expiration || 'MM/YY'}</span>
            </div>
          </div>

          <div className="panel">
            <p className="panel-title">Dados do cartão</p>
            <form className="pay-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="card-number">Número do cartão</label>
                <input
                  id="card-number"
                  className="input-card-number"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="4111111111111111"
                  value={form.card_number}
                  onChange={(e) => update('card_number', e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="holder-name">Nome do titular</label>
                <input
                  id="holder-name"
                  className="input-holder-name"
                  type="text"
                  maxLength={50}
                  placeholder="Joao Silva"
                  value={form.holder_name}
                  onChange={(e) => update('holder_name', e.target.value)}
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="expiration">Validade (MM/YY)</label>
                  <input
                    id="expiration"
                    className="input-expiration"
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={form.expiration}
                    onChange={(e) => update('expiration', e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    className="input-cvv"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="123"
                    value={form.cvv}
                    onChange={(e) => update('cvv', e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="amount">Valor (centavos)</label>
                  <input
                    id="amount"
                    className="input-amount"
                    type="number"
                    min="1"
                    max="1000000"
                    placeholder="15000"
                    value={form.amount_cents}
                    onChange={(e) => update('amount_cents', e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="installments">Parcelas</label>
                  <select
                    id="installments"
                    className="select-installments"
                    value={form.installments}
                    onChange={(e) => update('installments', e.target.value)}
                  >
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="description">Descrição</label>
                <input
                  id="description"
                  className="input-description"
                  type="text"
                  maxLength={100}
                  placeholder="Camiseta SENAI"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-pay" disabled={submitting}>
                {submitting ? 'Processando…' : 'Pagar'}
              </button>

              {feedback && (
                <div className={feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}>
                  {feedback.message}
                </div>
              )}
            </form>
          </div>
        </div>

        <div>
          <div className="panel balance-hero">
            <p className="panel-title">Saldo do caixa</p>
            <span
              className="display-balance"
              data-value={balance?.balance_cents ?? 0}
            >
              {formatCents(balance?.balance_cents ?? 0)}
            </span>

            <div className="balance-stats">
              <div className="stat-box">
                <span className="stat-label">Aprovadas</span>
                <span className="stat-value display-total-approved" data-value={balance?.total_approved ?? 0}>
                  {balance?.total_approved ?? 0}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Recusadas</span>
                <span className="stat-value display-total-declined" data-value={balance?.total_declined ?? 0}>
                  {balance?.total_declined ?? 0}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Estornadas</span>
                <span className="stat-value display-total-refunded" data-value={balance?.total_refunded ?? 0}>
                  {balance?.total_refunded ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="panel-title">Regras do livro-caixa</p>
            <div className="tx-meta-line" style={{ flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <span>• Cartões 4xxx, 5xxx, 3xxx e 6xxx são Visa, Mastercard, Amex e Elo.</span>
              <span>• Parcelar de 2x a 6x aplica 2% a.m.; de 7x a 12x, 4% a.m.</span>
              <span>• Limite diário de R$ 5.000,00 por cartão.</span>
              <span>• Cartões iniciados em 9999 são sempre recusados.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
