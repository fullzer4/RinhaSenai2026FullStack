import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getTransactions, refundTransaction, formatCents } from '../api.js'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 100)

  const [data, setData] = useState(null)

  const load = useCallback(() => {
    getTransactions(page, limit).then((r) => { if (r.ok) setData(r.data) })
  }, [page, limit])

  useEffect(() => {
    load()
  }, [load])

  function goToPage(nextPage) {
    setSearchParams({ page: String(nextPage), limit: String(limit) })
  }

  async function handleRefund(id) {
    await refundTransaction(id)
    load()
  }

  if (!data) return <p>Carregando...</p>

  const { data: items, pagination } = data

  return (
    <div>
      <h1>Historico de Transacoes</h1>

      <section className="card">
        {items.length === 0 ? (
          <p>Nenhuma transacao ainda.</p>
        ) : (
          <div className="list-transactions">
            {items.map((t) => (
              <div className="transaction-item" key={t.id}>
                <span className="transaction-id" data-value={t.id} title={t.id}>{t.id.slice(0, 8)}…</span>
                <span className="transaction-status" data-value={t.status}>{t.status}</span>
                <span className="transaction-amount" data-value={t.amount_cents}>{formatCents(t.amount_cents)}</span>
                <span className="transaction-brand" data-value={t.card_brand}>{t.card_brand}</span>
                <span className="transaction-installments" data-value={t.installments}>{t.installments}x</span>
                <span className="transaction-installment-amount" data-value={t.installment_amount}>
                  {formatCents(t.installment_amount)}
                </span>
                <span className="transaction-total" data-value={t.total_with_interest}>
                  {formatCents(t.total_with_interest)}
                </span>
                <span className="transaction-fee" data-value={t.fee_cents}>{formatCents(t.fee_cents)}</span>
                <span className="transaction-description" data-value={t.description}>{t.description}</span>
                <span className="transaction-card" data-value={t.card_last4}>•••• {t.card_last4}</span>
                <span className="transaction-date" data-value={t.created_at}>
                  {new Date(t.created_at).toLocaleString('pt-BR')}
                </span>
                <Link to={`/transaction/${t.id}`}>Detalhe</Link>
                {t.status === 'approved' && (
                  <button type="button" className="btn-refund" onClick={() => handleRefund(t.id)}>
                    Estornar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          <span>
            Pagina <span className="pagination-current" data-value={pagination.page}>{pagination.page}</span>
            {' de '}
            <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span>
            {' ('}
            <span className="pagination-total" data-value={pagination.total}>{pagination.total}</span>
            {' no total)'}
          </span>
          <button
            type="button"
            className="btn-prev-page"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn-next-page"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Proximo
          </button>
        </div>
      </section>
    </div>
  )
}
