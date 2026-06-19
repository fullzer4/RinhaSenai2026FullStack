import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
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

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page') || 1), 1)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 10), 1), 100)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page, limit, total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch(apiUrl(`/api/transactions?page=${page}&limit=${limit}`))
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.data || [])
      setPagination(json.pagination || { page, limit, total: 0, total_pages: 0 })
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, limit])

  async function refund(id) {
    await fetch(apiUrl(`/api/transactions/${id}/refund`), { method: 'POST' })
    await load()
  }

  function goTo(newPage) {
    setSearchParams({ page: String(newPage), limit: String(limit) })
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Movimento</p>
          <h1>Historico</h1>
        </div>
      </header>

      <div className="list-transactions">
        {loading && <div className="empty-state">Carregando transacoes...</div>}
        {!loading && transactions.length === 0 && (
          <div className="empty-state">Nenhuma transacao encontrada.</div>
        )}
        {!loading && transactions.map(tx => (
          <div className="transaction-item" key={tx.id}>
            <div className="transaction-head">
              <div>
                <span className="transaction-card-badge">**** {tx.card_last4}</span>
                <p>ID: <Link className="transaction-id" data-value={tx.id} to={`/transaction/${tx.id}`}>{tx.id}</Link></p>
              </div>
              <span className={`transaction-status status-pill status-${tx.status}`} data-value={tx.status}>{statusLabel(tx.status)}</span>
            </div>
            <div className="transaction-grid">
              <p className="transaction-row"><span>Valor</span><span className="transaction-amount" data-value={tx.amount_cents}>{money(tx.amount_cents)}</span></p>
              <p className="transaction-row"><span>Bandeira</span><span className="transaction-brand" data-value={tx.card_brand}>{brandLabel(tx.card_brand)}</span></p>
              <p className="transaction-row"><span>Parcelas</span><span className="transaction-installments" data-value={tx.installments}>{tx.installments}x</span></p>
              <p className="transaction-row"><span>Valor parcela</span><span className="transaction-installment-amount" data-value={tx.installment_amount}>{money(tx.installment_amount)}</span></p>
              <p className="transaction-row"><span>Total c/ juros</span><span className="transaction-total" data-value={tx.total_with_interest}>{money(tx.total_with_interest)}</span></p>
              <p className="transaction-row"><span>Taxa</span><span className="transaction-fee" data-value={tx.fee_cents}>{money(tx.fee_cents)}</span></p>
              <p className="transaction-row"><span>Descricao</span><span className="transaction-description" data-value={tx.description}>{tx.description}</span></p>
              <p className="transaction-row"><span>Cartao</span><span className="transaction-card" data-value={tx.card_last4}>{tx.card_last4}</span></p>
              <p className="transaction-row"><span>Data</span><span className="transaction-date" data-value={tx.created_at}>{dateLabel(tx.created_at)}</span></p>
            </div>
            {tx.status === 'approved' && <button className="btn-refund" onClick={() => refund(tx.id)}>Estornar</button>}
          </div>
        ))}
      </div>

      <div className="pagination-bar">
        <div className="pagination-meta">
          <span>Pagina <span className="pagination-current" data-value={pagination.page}>{pagination.page}</span></span>
          <span>de <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span></span>
          <span>Total: <span className="pagination-total" data-value={pagination.total}>{pagination.total}</span></span>
        </div>
        <button className="btn-prev-page" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</button>
        <button className="btn-next-page" disabled={page >= pagination.total_pages} onClick={() => goTo(page + 1)}>Proximo</button>
      </div>
    </div>
  )
}
