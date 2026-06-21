import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import '../styles/History.css'

const API_URL = 'http://localhost:3000/api'

const statusTranslation = {
  'approved': 'Aprovada',
  'declined': 'Recusada',
  'refunded': 'Estornada'
}

const getStatusLabel = (status) => statusTranslation[status] || status

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)

  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 10

  useEffect(() => {
    fetchTransactions()
  }, [page, limit])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/transactions?page=${page}&limit=${limit}`)
      const data = await res.json()
      setTransactions(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`${API_URL}/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const goToPage = (newPage) => {
    setSearchParams({ page: newPage, limit })
  }

  return (
    <div className="history">
      <h2>📋 Histórico de Transações</h2>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="empty">Nenhuma transação encontrada</p>
      ) : (
        <>
          <div className="list-transactions">
            {transactions.map(t => (
              <Link key={t.id} to={`/transaction/${t.id}`} className="transaction-item">
                <div className="item-header">
                  <span className={`transaction-status status-${t.status}`} data-value={t.status}>
                    {getStatusLabel(t.status)}
                  </span>
                  <span className="transaction-brand" data-value={t.card_brand}>
                    {t.card_brand.toUpperCase()}
                  </span>
                </div>
                <div className="item-body">
                  <span className="transaction-description">{t.description}</span>
                  <span className="transaction-card" data-value={t.card_last4}>
                    •••• {t.card_last4}
                  </span>
                </div>
                <div className="item-footer">
                  <span className="transaction-amount" data-value={t.amount_cents}>
                    R$ {(t.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="transaction-date">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {t.status === 'approved' && (
                  <button
                    className="btn-refund"
                    onClick={(e) => handleRefund(t.id, e)}
                  >
                    🔄 Estornar
                  </button>
                )}
              </Link>
            ))}
          </div>

          {pagination && (
            <div className="pagination">
              <button
                className="btn-prev-page"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                <span className="pagination-current" data-value={page}>{page}</span>
                <span> / </span>
                <span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span>
              </span>
              <button
                className="btn-next-page"
                onClick={() => goToPage(page + 1)}
                disabled={page >= pagination.total_pages}
              >
                Próximo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}