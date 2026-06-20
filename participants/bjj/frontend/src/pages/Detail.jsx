import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { api, formatCents, formatDate, brandLabel, statusLabel } from '../lib/api.js'

export default function Detail() {
  const { id } = useParams()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await api.get(`/transactions/${id}`)
    if (r.status === 404) {
      setNotFound(true)
    } else if (r.ok) {
      setTx(r.data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleRefund() {
    setRefunding(true)
    setError(null)
    const r = await api.post(`/transactions/${id}/refund`)
    if (r.ok) {
      setTx(r.data)
    } else {
      setError('Não foi possível estornar esta transação.')
    }
    setRefunding(false)
  }

  if (loading) {
    return <p className="loading-text">Carregando transação…</p>
  }

  if (notFound || !tx) {
    return (
      <div>
        <Link to="/history" className="back-link">← Voltar ao histórico</Link>
        <p className="empty-state">Transação não encontrada.</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/history" className="back-link">← Voltar ao histórico</Link>

      <h1>Lançamento detalhado</h1>
      <p className="page-subtitle detail-id" data-value={tx.id}>{tx.id}</p>

      <div className="panel">
        <div className="detail-status-row">
          <span className={`detail-status detail-status-badge ${tx.status}`} data-value={tx.status}>
            {statusLabel(tx.status)}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="field-label">Titular</span>
            <span className="detail-holder field-value">{tx.holder_name}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Cartão</span>
            <span className="detail-brand field-value" data-value={tx.card_brand}>
              {brandLabel(tx.card_brand)} •••• <span className="detail-card" data-value={tx.card_last4}>{tx.card_last4}</span>
            </span>
          </div>
          <div className="detail-field">
            <span className="field-label">Valor original</span>
            <span className="detail-amount field-value" data-value={tx.amount_cents}>{formatCents(tx.amount_cents)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Parcelas</span>
            <span className="detail-installments field-value" data-value={tx.installments}>{tx.installments}x</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Valor da parcela</span>
            <span className="detail-installment-amount field-value" data-value={tx.installment_amount}>{formatCents(tx.installment_amount)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Total com juros</span>
            <span className="detail-total field-value" data-value={tx.total_with_interest}>{formatCents(tx.total_with_interest)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Taxa da bandeira</span>
            <span className="detail-fee field-value" data-value={tx.fee_cents}>{formatCents(tx.fee_cents)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Valor líquido</span>
            <span className="detail-net field-value" data-value={tx.net_amount}>{formatCents(tx.net_amount)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Descrição</span>
            <span className="detail-description field-value">{tx.description}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Data</span>
            <span className="detail-date field-value" data-value={tx.created_at}>{formatDate(tx.created_at)}</span>
          </div>
        </div>

        {tx.status === 'approved' && (
          <div className="detail-actions">
            <button type="button" className="btn-refund" disabled={refunding} onClick={handleRefund}>
              {refunding ? 'Estornando…' : 'Estornar transação'}
            </button>
          </div>
        )}

        {error && <div className="feedback-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  )
}
