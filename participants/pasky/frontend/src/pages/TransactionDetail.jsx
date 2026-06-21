import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/TransactionDetail.css'

const API_URL = 'http://localhost:3000/api'

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransaction()
  }, [id])

  const fetchTransaction = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`)
      const data = await res.json()
      setTransaction(data)
    } catch (error) {
      console.error('Erro ao buscar transação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        fetchTransaction()
      }
    } catch (error) {
      console.error('Erro ao estornar:', error)
    }
  }

  if (loading) return <p>Carregando...</p>
  if (!transaction) return <p>Transação não encontrada</p>

  return (
    <div className="transaction-detail">
      <button onClick={() => navigate('/history')} className="btn-back">← Voltar</button>

      <div className="detail-card">
        <h2>Detalhes da Transação</h2>

        <div className="detail-row">
          <label>ID</label>
          <span className="detail-id" data-value={transaction.id}>{transaction.id}</span>
        </div>

        <div className="detail-row">
          <label>Status</label>
          <span className={`detail-status status-${transaction.status}`} data-value={transaction.status}>
            {transaction.status.toUpperCase()}
          </span>
        </div>

        <div className="detail-row">
          <label>Bandeira</label>
          <span className="detail-brand" data-value={transaction.card_brand}>
            {transaction.card_brand.toUpperCase()}
          </span>
        </div>

        <div className="detail-row">
          <label>Titular</label>
          <span className="detail-holder">{transaction.holder_name}</span>
        </div>

        <div className="detail-row">
          <label>Cartão</label>
          <span className="detail-card" data-value={transaction.card_last4}>
            •••• {transaction.card_last4}
          </span>
        </div>

        <div className="detail-row">
          <label>Valor</label>
          <span className="detail-amount" data-value={transaction.amount_cents}>
            R$ {(transaction.amount_cents / 100).toFixed(2)}
          </span>
        </div>

        <div className="detail-row">
          <label>Parcelas</label>
          <span className="detail-installments" data-value={transaction.installments}>
            {transaction.installments}x
          </span>
        </div>

        {transaction.installments > 1 && (
          <>
            <div className="detail-row">
              <label>Valor por Parcela</label>
              <span className="detail-installment-amount" data-value={transaction.installment_amount}>
                R$ {(transaction.installment_amount / 100).toFixed(2)}
              </span>
            </div>

            <div className="detail-row">
              <label>Total com Juros</label>
              <span className="detail-total" data-value={transaction.total_with_interest}>
                R$ {(transaction.total_with_interest / 100).toFixed(2)}
              </span>
            </div>
          </>
        )}

        <div className="detail-row">
          <label>Taxa</label>
          <span className="detail-fee" data-value={transaction.fee_cents}>
            R$ {(transaction.fee_cents / 100).toFixed(2)}
          </span>
        </div>

        <div className="detail-row">
          <label>Valor Líquido</label>
          <span className="detail-net" data-value={transaction.net_amount}>
            R$ {(transaction.net_amount / 100).toFixed(2)}
          </span>
        </div>

        <div className="detail-row">
          <label>Descrição</label>
          <span className="detail-description">{transaction.description}</span>
        </div>

        <div className="detail-row">
          <label>Data</label>
          <span className="detail-date">{new Date(transaction.created_at).toLocaleString('pt-BR')}</span>
        </div>

        {transaction.status === 'approved' && (
          <button className="btn-refund" onClick={handleRefund}>
            Estornar Transação
          </button>
        )}
      </div>
    </div>
  )
}