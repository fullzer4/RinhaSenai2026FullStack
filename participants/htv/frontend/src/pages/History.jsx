import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import './styles/history.css'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)

  // Lê page e limit dos query params (default: page=1, limit=10)
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 10

  // Buscar transações quando page ou limit mudar
  useEffect(() => {
    setLoading(true)
    fetch(`/api/transactions?page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.data)
        setPagination(data.pagination)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erro ao buscar transacoes:', err)
        setLoading(false)
      })
  }, [page, limit])

  // Navegar para uma página específica
  function goToPage(newPage) {
    if (newPage < 1 || (pagination && newPage > pagination.total_pages)) return
    setSearchParams({ page: String(newPage), limit: String(limit) })
  }

  // Estorno de uma transação
  async function handleRefund(transactionId) {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/refund`, {
        method: 'POST'
      })
      if (res.ok) {
        // Recarrega a lista atual
        const response = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
        const data = await response.json()
        setTransactions(data.data)
        setPagination(data.pagination)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao estornar')
      }
    } catch (err) {
      alert('Erro de conexão')
    }
  }

  return (
    <div>
      <h1>Historico de Transacoes</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* Lista de transacoes */}
          <div className="list-transactions">
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <p>
                  ID: <span className="transaction-id" data-value={tx.id}>{tx.id}</span>
                </p>
                <p>
                  Status: <span className="transaction-status" data-value={tx.status}>{tx.status}</span>
                </p>
                <p>
                  Valor: <span className="transaction-amount" data-value={tx.amount_cents}>
                    R$ {(tx.amount_cents / 100).toFixed(2)}
                  </span>
                </p>
                <p>
                  Bandeira: <span className="transaction-brand" data-value={tx.card_brand}>{tx.card_brand}</span>
                </p>
                <p>
                  Parcelas: <span className="transaction-installments" data-value={tx.installments}>{tx.installments}x</span>
                </p>
                <p>
                  Valor parcela: <span className="transaction-installment-amount" data-value={tx.installment_amount}>
                    R$ {(tx.installment_amount / 100).toFixed(2)}
                  </span>
                </p>
                <p>
                  Total c/ juros: <span className="transaction-total" data-value={tx.total_with_interest}>
                    R$ {(tx.total_with_interest / 100).toFixed(2)}
                  </span>
                </p>
                <p>
                  Taxa: <span className="transaction-fee" data-value={tx.fee_cents}>
                    R$ {(tx.fee_cents / 100).toFixed(2)}
                  </span>
                </p>
                <p>
                  Descricao: <span className="transaction-description" data-value={tx.description}>{tx.description}</span>
                </p>
                <p>
                  Cartao: <span className="transaction-card" data-value={tx.card_last4}>****{tx.card_last4}</span>
                </p>
                <p>
                  Data: <span className="transaction-date" data-value={tx.created_at}>
                    {new Date(tx.created_at).toLocaleString('pt-BR')}
                  </span>
                </p>

                {/* Botao de estorno - aparece apenas se status for approved */}
                {tx.status === 'approved' && (
                  <button className="btn-refund" onClick={() => handleRefund(tx.id)}>
                    Estornar
                  </button>
                )}

                <hr />
              </div>
            ))}
          </div>

          {/* Paginacao */}
          {pagination && (
            <div>
              <p>
                Pagina{' '}
                <span className="pagination-current" data-value={pagination.page}>
                  {pagination.page}
                </span>{' '}
                de{' '}
                <span className="pagination-pages" data-value={pagination.total_pages}>
                  {pagination.total_pages}
                </span>{' '}
                — Total:{' '}
                <span className="pagination-total" data-value={pagination.total}>
                  {pagination.total}
                </span>{' '}
                transacoes
              </p>
              <button
                className="btn-prev-page"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Anterior
              </button>
              <button
                className="btn-next-page"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => goToPage(page + 1)}
              >
                Proximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
