import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router'
import { api, formatCents, formatDate, brandLabel, statusLabel } from '../lib/api.js'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 10))

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refundingId, setRefundingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await api.get(`/transactions?page=${page}&limit=${limit}`)
    if (r.ok) setResult(r.data)
    setLoading(false)
  }, [page, limit])

  useEffect(() => { load() }, [load])

  function goToPage(nextPage) {
    setSearchParams({ page: String(nextPage), limit: String(limit) })
  }

  function changeLimit(nextLimit) {
    setSearchParams({ page: '1', limit: String(nextLimit) })
  }

  async function handleRefund(id) {
    setRefundingId(id)
    await api.post(`/transactions/${id}/refund`)
    await load()
    setRefundingId(null)
  }

  const pagination = result?.pagination
  const items = result?.data || []

  return (
    <div>
      <div className="history-toolbar">
        <div>
          <h1>Razão de lançamentos</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Toda cobrança registrada no caixa, com status e valores na ponta do lápis.
          </p>
        </div>
        <select
          className="limit-select"
          value={limit}
          onChange={(e) => changeLimit(e.target.value)}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} por página</option>
          ))}
        </select>
      </div>

      <div className="panel">
        {loading && !result ? (
          <p className="loading-text">Carregando transações…</p>
        ) : items.length === 0 ? (
          <p className="empty-state">Nenhuma transação encontrada.</p>
        ) : (
          <div className="list-transactions">
            {items.map((tx) => (
              <div className="transaction-item" key={tx.id}>
                <span className={`tx-status-pip ${tx.status}`} />

                <div className="tx-main-info">
                  <span className="transaction-description">{tx.description}</span>
                  <span className="tx-meta-line">
                    <span className="transaction-id" data-value={tx.id} title={tx.id}>
                      #{tx.id.slice(0, 8)}
                    </span>
                    <span className="transaction-card" data-value={tx.card_last4}>•••• {tx.card_last4}</span>
                    <span className="transaction-brand" data-value={tx.card_brand}>{brandLabel(tx.card_brand)}</span>
                    <span className="transaction-installments" data-value={tx.installments}>{tx.installments}x</span>
                    <span className="transaction-date" data-value={tx.created_at}>{formatDate(tx.created_at)}</span>
                  </span>
                </div>

                <div className="tx-amounts">
                  <span className="transaction-amount" data-value={tx.amount_cents}>
                    {formatCents(tx.amount_cents)}
                  </span>
                  <span
                    className="transaction-status"
                    data-value={tx.status}
                    style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
                  >
                    {statusLabel(tx.status)}
                  </span>
                  <span className="tx-fee-line">
                    <span className="transaction-total" data-value={tx.total_with_interest}>
                      tot {formatCents(tx.total_with_interest)}
                    </span>
                    {' · '}
                    <span className="transaction-fee" data-value={tx.fee_cents}>
                      taxa {formatCents(tx.fee_cents)}
                    </span>
                    {' · '}
                    <span className="transaction-installment-amount" data-value={tx.installment_amount}>
                      {formatCents(tx.installment_amount)}/parc.
                    </span>
                  </span>
                </div>

                <div className="tx-actions">
                  <Link to={`/transaction/${tx.id}`} className="btn-view">Ver</Link>
                  {tx.status === 'approved' && (
                    <button
                      type="button"
                      className="btn-refund"
                      disabled={refundingId === tx.id}
                      onClick={() => handleRefund(tx.id)}
                    >
                      {refundingId === tx.id ? 'Estornando…' : 'Estornar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination && (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn-prev-page"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            ← Anterior
          </button>

          <span className="pagination-info">
            <span className="pagination-current" data-value={pagination.page}>{pagination.page}</span>
            <span>/</span>
            <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span>
            <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>
              (<span className="pagination-total" data-value={pagination.total}>{pagination.total}</span> no total)
            </span>
          </span>

          <button
            type="button"
            className="btn-next-page"
            disabled={page >= pagination.total_pages}
            onClick={() => goToPage(page + 1)}
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  )
}
