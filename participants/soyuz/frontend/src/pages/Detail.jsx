import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

function money(cents) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2)}`
}

export default function Detail() {
  const { id } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [error, setError] = useState(null)

  async function loadTransaction() {
    const res = await fetch(`/api/transactions/${id}`)
    if (res.ok) {
      setTransaction(await res.json())
      setError(null)
    } else {
      setError('Transacao nao encontrada')
    }
  }

  useEffect(() => {
    loadTransaction()
  }, [id])

  async function refund() {
    await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
    await loadTransaction()
  }

  if (error) return <p>{error}</p>
  if (!transaction) return <p>Carregando...</p>

  return (
    <div>
      <h1>Detalhe da Transacao</h1>

      <p>ID: <span className="detail-id" data-value={transaction.id}>{transaction.id}</span></p>
      <p>Status: <span className="detail-status" data-value={transaction.status}>{transaction.status}</span></p>
      <p>Valor: <span className="detail-amount" data-value={transaction.amount_cents}>{money(transaction.amount_cents)}</span></p>
      <p>Bandeira: <span className="detail-brand" data-value={transaction.card_brand}>{transaction.card_brand}</span></p>
      <p>Titular: <span className="detail-holder" data-value={transaction.holder_name}>{transaction.holder_name}</span></p>
      <p>Cartao: <span className="detail-card" data-value={transaction.card_last4}>{transaction.card_last4}</span></p>
      <p>Parcelas: <span className="detail-installments" data-value={transaction.installments}>{transaction.installments}</span></p>
      <p>Valor parcela: <span className="detail-installment-amount" data-value={transaction.installment_amount}>{money(transaction.installment_amount)}</span></p>
      <p>Total: <span className="detail-total" data-value={transaction.total_with_interest}>{money(transaction.total_with_interest)}</span></p>
      <p>Taxa: <span className="detail-fee" data-value={transaction.fee_cents}>{money(transaction.fee_cents)}</span></p>
      <p>Liquido: <span className="detail-net" data-value={transaction.net_amount}>{money(transaction.net_amount)}</span></p>
      <p>Descricao: <span className="detail-description" data-value={transaction.description}>{transaction.description}</span></p>
      <p>Data: <span className="detail-date" data-value={transaction.created_at}>{transaction.created_at}</span></p>
      {transaction.status === 'approved' && <button className="btn-refund" onClick={refund}>Estornar</button>}
    </div>
  )
}
