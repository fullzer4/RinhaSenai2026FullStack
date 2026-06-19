import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { getTransaction, refundTransaction, formatCents } from '../api.js'

function Field({ label, className, value, children }) {
  return (
    <div className="detail-field">
      <span className="label">{label}</span>
      <span className={className} data-value={value}>{children}</span>
    </div>
  )
}

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
      <p><Link to="/history">&larr; Voltar para o historico</Link></p>

      <section className="card">
        <div className="detail-grid">
          <Field label="ID" className="detail-id" value={transaction.id}>{transaction.id}</Field>
          <Field label="Status" className="detail-status" value={transaction.status}>{transaction.status}</Field>
          <Field label="Valor" className="detail-amount" value={transaction.amount_cents}>
            {formatCents(transaction.amount_cents)}
          </Field>
          <Field label="Bandeira" className="detail-brand" value={transaction.card_brand}>
            {transaction.card_brand}
          </Field>
          <Field label="Titular" className="detail-holder" value={transaction.holder_name}>
            {transaction.holder_name}
          </Field>
          <Field label="Cartao" className="detail-card" value={transaction.card_last4}>
            •••• {transaction.card_last4}
          </Field>
          <Field label="Parcelas" className="detail-installments" value={transaction.installments}>
            {transaction.installments}x
          </Field>
          <Field label="Valor da parcela" className="detail-installment-amount" value={transaction.installment_amount}>
            {formatCents(transaction.installment_amount)}
          </Field>
          <Field label="Total com juros" className="detail-total" value={transaction.total_with_interest}>
            {formatCents(transaction.total_with_interest)}
          </Field>
          <Field label="Taxa" className="detail-fee" value={transaction.fee_cents}>
            {formatCents(transaction.fee_cents)}
          </Field>
          <Field label="Valor liquido" className="detail-net" value={transaction.net_amount}>
            {formatCents(transaction.net_amount)}
          </Field>
          <Field label="Descricao" className="detail-description" value={transaction.description}>
            {transaction.description}
          </Field>
          <Field label="Data" className="detail-date" value={transaction.created_at}>
            {new Date(transaction.created_at).toLocaleString('pt-BR')}
          </Field>
        </div>

        {transaction.status === 'approved' && (
          <button type="button" className="btn-refund" style={{ marginTop: '1rem' }} onClick={handleRefund}>
            Estornar
          </button>
        )}
      </section>
    </div>
  )
}
