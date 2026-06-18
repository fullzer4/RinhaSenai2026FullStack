import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { getTransaction, refundTransaction, formatCents } from '../api.js'

export default function Detail() {
  const { id } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(() => {
    getTransaction(id).then((r) => {
      if (r.ok) setTransaction(r.data)
      else setNotFound(true)
    })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleRefund() {
    await refundTransaction(id)
    load()
  }

  if (notFound) return <p>Transacao nao encontrada.</p>
  if (!transaction) return <p>Carregando...</p>

  return (
    <div>
      <h1>Detalhe da Transacao</h1>
      <Link to="/history">&larr; Voltar</Link>

      <p>ID: <span className="detail-id" data-value={transaction.id}>{transaction.id}</span></p>
      <p>Status: <span className="detail-status" data-value={transaction.status}>{transaction.status}</span></p>
      <p>
        Valor: <span className="detail-amount" data-value={transaction.amount_cents}>
          {formatCents(transaction.amount_cents)}
        </span>
      </p>
      <p>Bandeira: <span className="detail-brand" data-value={transaction.card_brand}>{transaction.card_brand}</span></p>
      <p>Titular: <span className="detail-holder" data-value={transaction.holder_name}>{transaction.holder_name}</span></p>
      <p>Cartao: <span className="detail-card" data-value={transaction.card_last4}>{transaction.card_last4}</span></p>
      <p>
        Parcelas: <span className="detail-installments" data-value={transaction.installments}>
          {transaction.installments}
        </span>
      </p>
      <p>
        Valor da parcela: <span className="detail-installment-amount" data-value={transaction.installment_amount}>
          {formatCents(transaction.installment_amount)}
        </span>
      </p>
      <p>
        Total com juros: <span className="detail-total" data-value={transaction.total_with_interest}>
          {formatCents(transaction.total_with_interest)}
        </span>
      </p>
      <p>Taxa: <span className="detail-fee" data-value={transaction.fee_cents}>{formatCents(transaction.fee_cents)}</span></p>
      <p>
        Valor liquido: <span className="detail-net" data-value={transaction.net_amount}>
          {formatCents(transaction.net_amount)}
        </span>
      </p>
      <p>
        Descricao: <span className="detail-description" data-value={transaction.description}>
          {transaction.description}
        </span>
      </p>
      <p>
        Data: <span className="detail-date" data-value={transaction.created_at}>
          {new Date(transaction.created_at).toLocaleString('pt-BR')}
        </span>
      </p>

      {transaction.status === 'approved' && (
        <button type="button" className="btn-refund" onClick={handleRefund}>
          Estornar
        </button>
      )}
    </div>
  )
}
