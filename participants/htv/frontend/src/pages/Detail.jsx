import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

import './styles/detail.css'

export default function Detail() {
  const { id } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState (true)
  const [error, setError] = useState (null)

   useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Transação não encontrada')
        return res.json()
      })
      .then(data => {
        setTransaction(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  // Função de estorno
  async function handleRefund() {
    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setTransaction(updated)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao estornar')
      }
    } catch (err) {
      alert('Erro de conexão')
    }
  }

  // Enquanto carrega
  if (loading) return <div>Carregando...</div>

  // Se deu erro
  if (error) return <div>Erro: {error}</div>

  // Se não encontrou
  if (!transaction) return <div>Transação não encontrada</div>

  // Formatar data
  const date = new Date(transaction.created_at).toLocaleString('pt-BR')

  return (
    <div>
      <h1>Detalhe da Transacao</h1>

      <table>
        <tbody>
          <tr>
            <td>ID:</td>
            <td><span className="detail-id" data-value={transaction.id}>{transaction.id}</span></td>
          </tr>
          <tr>
            <td>Status:</td>
            <td><span className="detail-status" data-value={transaction.status}>{transaction.status}</span></td>
          </tr>
          <tr>
            <td>Valor:</td>
            <td>
              <span className="detail-amount" data-value={transaction.amount_cents}>
                R$ {(transaction.amount_cents / 100).toFixed(2)}
              </span>
            </td>
          </tr>
          <tr>
            <td>Bandeira:</td>
            <td><span className="detail-brand" data-value={transaction.card_brand}>{transaction.card_brand}</span></td>
          </tr>
          <tr>
            <td>Titular:</td>
            <td><span className="detail-holder" data-value={transaction.holder_name}>{transaction.holder_name}</span></td>
          </tr>
          <tr>
            <td>Últimos 4 dígitos:</td>
            <td><span className="detail-card" data-value={transaction.card_last4}>{transaction.card_last4}</span></td>
          </tr>
          <tr>
            <td>Parcelas:</td>
            <td>
              <span className="detail-installments" data-value={transaction.installments}>
                {transaction.installments}x
              </span>
            </td>
          </tr>
          <tr>
            <td>Valor da parcela:</td>
            <td>
              <span className="detail-installment-amount" data-value={transaction.installment_amount}>
                R$ {(transaction.installment_amount / 100).toFixed(2)}
              </span>
            </td>
          </tr>
          <tr>
            <td>Total com juros:</td>
            <td>
              <span className="detail-total" data-value={transaction.total_with_interest}>
                R$ {(transaction.total_with_interest / 100).toFixed(2)}
              </span>
            </td>
          </tr>
          <tr>
            <td>Taxa da bandeira:</td>
            <td>
              <span className="detail-fee" data-value={transaction.fee_cents}>
                R$ {(transaction.fee_cents / 100).toFixed(2)}
              </span>
            </td>
          </tr>
          <tr>
            <td>Valor líquido:</td>
            <td>
              <span className="detail-net" data-value={transaction.net_amount}>
                R$ {(transaction.net_amount / 100).toFixed(2)}
              </span>
            </td>
          </tr>
          <tr>
            <td>Descrição:</td>
            <td><span className="detail-description" data-value={transaction.description}>{transaction.description}</span></td>
          </tr>
          <tr>
            <td>Data:</td>
            <td><span className="detail-date" data-value={transaction.created_at}>{date}</span></td>
          </tr>
        </tbody>
      </table>

      {/* Botão de estorno - só aparece se status for 'approved' */}
      {transaction.status === 'approved' && (
        <button className="btn-refund" onClick={handleRefund}>
          Estornar
        </button>
      )}
    </div>
  )
}
  