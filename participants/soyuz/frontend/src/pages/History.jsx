import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'

function money(cents) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2)}`
}

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })

  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.max(1, Number(searchParams.get('limit') || 10))

  async function loadTransactions() {
    const res = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
    if (res.ok) {
      const data = await res.json()
      setTransactions(data.data)
      setPagination(data.pagination)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [page, limit])

  function goTo(nextPage) {
    setSearchParams({ page: String(nextPage), limit: String(limit) })
  }

  async function refund(id) {
    await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
    await loadTransactions()
  }

  return (
    <div>
      <h1>Historico de Transacoes</h1>

      <div className="list-transactions">
        {transactions.map((tx) => (
          <div className="transaction-item" key={tx.id}>
            <p>ID: <Link className="transaction-id" data-value={tx.id} to={`/transaction/${tx.id}`}>{tx.id}</Link></p>
            <p>Status: <span className="transaction-status" data-value={tx.status}>{tx.status}</span></p>
            <p>Valor: <span className="transaction-amount" data-value={tx.amount_cents}>{money(tx.amount_cents)}</span></p>
            <p>Bandeira: <span className="transaction-brand" data-value={tx.card_brand}>{tx.card_brand}</span></p>
            <p>Parcelas: <span className="transaction-installments" data-value={tx.installments}>{tx.installments}</span></p>
            <p>Valor parcela: <span className="transaction-installment-amount" data-value={tx.installment_amount}>{money(tx.installment_amount)}</span></p>
            <p>Total: <span className="transaction-total" data-value={tx.total_with_interest}>{money(tx.total_with_interest)}</span></p>
            <p>Taxa: <span className="transaction-fee" data-value={tx.fee_cents}>{money(tx.fee_cents)}</span></p>
            <p>Descricao: <span className="transaction-description" data-value={tx.description}>{tx.description}</span></p>
            <p>Cartao: <span className="transaction-card" data-value={tx.card_last4}>{tx.card_last4}</span></p>
            <p>Data: <span className="transaction-date" data-value={tx.created_at}>{tx.created_at}</span></p>
            {tx.status === 'approved' && <button className="btn-refund" onClick={() => refund(tx.id)}>Estornar</button>}
          </div>
        ))}
      </div>

      <nav>
        <span className="pagination-current" data-value={pagination.page}>{pagination.page}</span>
        {' / '}
        <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span>
        {' - '}
        <span className="pagination-total" data-value={pagination.total}>{pagination.total}</span>
        <button className="btn-prev-page" disabled={pagination.page <= 1} onClick={() => goTo(pagination.page - 1)}>Anterior</button>
        <button className="btn-next-page" disabled={pagination.page >= pagination.total_pages} onClick={() => goTo(pagination.page + 1)}>Proximo</button>
      </nav>
    </div>
  )
}
