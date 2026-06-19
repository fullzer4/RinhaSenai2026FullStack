import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { apiUrl } from '../api.js'

function money(cents = 0) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusLabel(status) {
  if (status === 'approved') return 'Aprovada'
  if (status === 'declined') return 'Recusada'
  if (status === 'refunded') return 'Estornada'
  return status
}

function brandLabel(brand) {
  if (brand === 'visa') return 'Visa'
  if (brand === 'mastercard') return 'Mastercard'
  if (brand === 'amex') return 'Amex'
  if (brand === 'elo') return 'Elo'
  return brand
}

function dateLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

export default function Detail() {
  const { id } = useParams()
  const [tx, setTx] = useState(null)

  async function load() {
    const res = await fetch(apiUrl(`/api/transactions/${id}`))
    if (res.ok) setTx(await res.json())
  }

  useEffect(() => {
    load()
  }, [id])

  async function refund() {
    await fetch(apiUrl(`/api/transactions/${id}/refund`), { method: 'POST' })
    await load()
  }

  if (!tx) return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Transacao</p>
          <h1>Detalhe</h1>
        </div>
      </header>
      <div className="empty-state">Carregando transacao...</div>
    </div>
  )

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Transacao</p>
          <h1>Detalhe</h1>
        </div>
        {tx.status === 'approved' && <button className="btn-refund" onClick={refund}>Estornar</button>}
      </header>

      <section className="detail-panel">
        <div className="detail-summary">
          <div>
            <span className="detail-card-badge">**** {tx.card_last4}</span>
            <strong>{money(tx.total_with_interest)}</strong>
          </div>
          <span className={`status-pill status-${tx.status}`}>{statusLabel(tx.status)}</span>
        </div>
        <div className="detail-grid">
          <p className="detail-row"><span>ID</span><span className="detail-id" data-value={tx.id}>{tx.id}</span></p>
          <p className="detail-row"><span>Status</span><span className={`detail-status status-pill detail-status-inline status-${tx.status}`} data-value={tx.status}>{statusLabel(tx.status)}</span></p>
          <p className="detail-row"><span>Valor</span><span className="detail-amount" data-value={tx.amount_cents}>{money(tx.amount_cents)}</span></p>
          <p className="detail-row"><span>Bandeira</span><span className="detail-brand" data-value={tx.card_brand}>{brandLabel(tx.card_brand)}</span></p>
          <p className="detail-row"><span>Titular</span><span className="detail-holder" data-value={tx.holder_name}>{tx.holder_name}</span></p>
          <p className="detail-row"><span>Cartao</span><span className="detail-card" data-value={tx.card_last4}>{tx.card_last4}</span></p>
          <p className="detail-row"><span>Parcelas</span><span className="detail-installments" data-value={tx.installments}>{tx.installments}x</span></p>
          <p className="detail-row"><span>Valor parcela</span><span className="detail-installment-amount" data-value={tx.installment_amount}>{money(tx.installment_amount)}</span></p>
          <p className="detail-row"><span>Total c/ juros</span><span className="detail-total" data-value={tx.total_with_interest}>{money(tx.total_with_interest)}</span></p>
          <p className="detail-row"><span>Taxa</span><span className="detail-fee" data-value={tx.fee_cents}>{money(tx.fee_cents)}</span></p>
          <p className="detail-row"><span>Valor liquido</span><span className="detail-net" data-value={tx.net_amount}>{money(tx.net_amount)}</span></p>
          <p className="detail-row"><span>Descricao</span><span className="detail-description" data-value={tx.description}>{tx.description}</span></p>
          <p className="detail-row"><span>Data</span><span className="detail-date" data-value={tx.created_at}>{dateLabel(tx.created_at)}</span></p>
        </div>
      </section>
    </div>
  )
}
