import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const limitParam = parseInt(searchParams.get('limit') || '10', 10)

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory(pageParam, limitParam)
  }, [pageParam, limitParam])

  const fetchHistory = async (page, limit) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setPagination(json.pagination)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (id) => {
    if (!confirm('Deseja realmente estornar esta transação?')) return
    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        fetchHistory(pagination.page, pagination.limit)
      } else {
        alert('Erro ao estornar')
      }
    } catch (e) {
      alert('Erro de conexão')
    }
  }

  const formatCurrency = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const statusLabel = (s) => ({ approved: 'Aprovada', declined: 'Recusada', refunded: 'Estornada' }[s] || s)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Histórico de Transações</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {!loading && <span><strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> transações no total</span>}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Carregando transações...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Nenhuma transação ainda</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Vá ao Dashboard e processe sua primeira transação.</p>
          <Link to="/" style={{ display: 'inline-block', background: 'var(--neon-green)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Ir para o Dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container list-transactions">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Bandeira</th>
                  <th>Cartão</th>
                  <th>Data</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.map(tx => (
                  <tr key={tx.id} className="transaction-item">
                    <td>
                      <span className={`badge badge-${tx.status} transaction-status`} data-value={tx.status}>
                        {statusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="transaction-description" data-value={tx.description} style={{ color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </td>
                    <td className="transaction-amount" data-value={tx.amount_cents} style={{ fontWeight: 600 }}>
                      {formatCurrency(tx.amount_cents)}
                    </td>
                    <td className="transaction-brand" data-value={tx.card_brand} style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {tx.card_brand}
                    </td>
                    <td className="transaction-card" data-value={tx.card_last4} style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      •••• {tx.card_last4}
                    </td>
                    <td className="transaction-date" data-value={tx.created_at} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(tx.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          to={`/transaction/${tx.id}`}
                          className="btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          Detalhes
                        </Link>
                        {tx.status === 'approved' && (
                          <button
                            className="btn-outline btn-refund"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => handleRefund(tx.id)}
                          >
                            Estornar
                          </button>
                        )}
                      </div>

                      {/* Hidden data tags for bench */}
                      <span className="transaction-id" data-value={tx.id} style={{ display: 'none' }}></span>
                      <span className="transaction-installments" data-value={tx.installments} style={{ display: 'none' }}></span>
                      <span className="transaction-installment-amount" data-value={tx.installment_amount} style={{ display: 'none' }}></span>
                      <span className="transaction-total" data-value={tx.total_with_interest} style={{ display: 'none' }}></span>
                      <span className="transaction-fee" data-value={tx.fee_cents} style={{ display: 'none' }}></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              Página <strong style={{ color: 'var(--text-primary)' }}><span className="pagination-current" data-value={pagination.page}>{pagination.page}</span></strong> de <strong style={{ color: 'var(--text-primary)' }}><span className="pagination-pages" data-value={pagination.total_pages}>{pagination.total_pages}</span></strong>
              <span className="pagination-total" data-value={pagination.total} style={{ display: 'none' }}></span>
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-outline btn-prev-page"
                disabled={pagination.page <= 1}
                onClick={() => setSearchParams({ page: pagination.page - 1, limit: pagination.limit })}
              >
                ← Anterior
              </button>
              <button
                className="btn-outline btn-next-page"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setSearchParams({ page: pagination.page + 1, limit: pagination.limit })}
              >
                Próximo →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
