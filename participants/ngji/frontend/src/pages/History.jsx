import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router'

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(isoString))
}

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)

  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 10

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, total_pages: 1 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handlePrevPage = () => {
    if (page > 1) {
      setSearchParams({ page: page - 1, limit })
    }
  }

  const handleNextPage = () => {
    if (page < pagination.total_pages) {
      setSearchParams({ page: page + 1, limit })
    }
  }

  const handleRefund = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Tem certeza que deseja estornar esta transação?')) return

    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        alert('Transação estornada com sucesso!')
        fetchTransactions()
      } else {
        const err = await res.json()
        alert(`Erro ao estornar: ${err.error || 'Desconhecido'}`)
      }
    } catch {
      alert('Erro de conexão ao estornar.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Histórico de Transações</h1>
        <p className="page-subtitle">Acompanhe todas as transações processadas</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div> Carregando transações...
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Nenhuma transação encontrada.</p>
          </div>
        ) : (
          <div className="list-transactions">
            {transactions.map(txn => (
              <div
                key={txn.id}
                className="transaction-item"
                onClick={() => navigate(`/transaction/${txn.id}`)}
              >
                <div className="txn-main">
                  <div className="txn-header">
                    <span className="txn-amount transaction-amount" data-value={txn.amount_cents}>
                      {formatBRL(txn.amount_cents)}
                    </span>
                    <span className={`badge badge-${txn.status} transaction-status`} data-value={txn.status}>
                      {txn.status === 'approved' ? 'Aprovada' : txn.status === 'declined' ? 'Recusada' : 'Estornada'}
                    </span>
                    <span className="badge transaction-brand" data-value={txn.card_brand}>
                      {txn.card_brand}
                    </span>
                  </div>
                  
                  <div className="txn-meta">
                    <span className="txn-meta-item transaction-id" data-value={txn.id}>
                      🆔 {txn.id.split('-')[0]}...
                    </span>
                    <span className="txn-meta-item transaction-date" data-value={txn.created_at}>
                      📅 {formatDate(txn.created_at)}
                    </span>
                    <span className="txn-meta-item transaction-card" data-value={txn.card_last4}>
                      💳 •••• {txn.card_last4}
                    </span>
                    <span className="txn-meta-item transaction-installments" data-value={txn.installments}>
                      📦 {txn.installments}x
                    </span>
                    <span className="txn-meta-item transaction-installment-amount" style={{display: 'none'}} data-value={txn.installment_amount}></span>
                    <span className="txn-meta-item transaction-total" style={{display: 'none'}} data-value={txn.total_with_interest}></span>
                    <span className="txn-meta-item transaction-fee" data-value={txn.fee_cents}>
                      💸 Taxa: {formatBRL(txn.fee_cents)}
                    </span>
                  </div>
                  
                  <div className="txn-meta">
                    <span className="txn-meta-item transaction-description" data-value={txn.description}>
                      📝 {txn.description}
                    </span>
                  </div>
                </div>
                
                <div className="txn-actions">
                  {txn.status === 'approved' && (
                    <button
                      className="btn btn-danger btn-refund"
                      onClick={(e) => handleRefund(e, txn.id)}
                    >
                      ↺ Estornar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="pagination">
            <button
              className="btn btn-outline btn-prev-page"
              onClick={handlePrevPage}
              disabled={page <= 1}
            >
              ← Anterior
            </button>
            <div className="pagination-info">
              Página <span className="pagination-current" data-value={pagination.page}>{pagination.page}</span> de <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span> 
              (<span className="pagination-total" data-value={pagination.total}>{pagination.total}</span> total)
            </div>
            <button
              className="btn btn-outline btn-next-page"
              onClick={handleNextPage}
              disabled={page >= pagination.total_pages}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
