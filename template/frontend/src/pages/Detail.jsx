import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

export default function Detail() {
  const { id } = useParams()
  const [tx, setTx] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Transacao nao encontrada')
        return res.json()
      })
      .then(setTx)
      .catch((err) => setError(err.message))
  }, [id])

  const handleRefund = async () => {
    const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setTx(updated)
    }
  }

  if (error) return <p>{error}</p>
  if (!tx) return <p>Carregando...</p>

  return (
    <div>
      <h1>Detalhe da Transacao</h1>

      {/* IMPORTANTE: cada elemento precisa da classe .detail-* e data-value */}
      <table>
        <tbody>
          <tr>
            <td>ID</td>
            <td className="detail-id" data-value={tx.id}>{tx.id}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td className="detail-status" data-value={tx.status}>{tx.status}</td>
          </tr>
          <tr>
            <td>Valor</td>
            <td className="detail-amount" data-value={tx.amount_cents}>
              R$ {(tx.amount_cents / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Bandeira</td>
            <td className="detail-brand" data-value={tx.card_brand}>{tx.card_brand}</td>
          </tr>
          <tr>
            <td>Titular</td>
            <td className="detail-holder" data-value={tx.holder_name}>{tx.holder_name}</td>
          </tr>
          <tr>
            <td>Cartao</td>
            <td className="detail-card" data-value={tx.card_last4}>**** {tx.card_last4}</td>
          </tr>
          <tr>
            <td>Parcelas</td>
            <td className="detail-installments" data-value={tx.installments}>{tx.installments}x</td>
          </tr>
          <tr>
            <td>Valor da Parcela</td>
            <td className="detail-installment-amount" data-value={tx.installment_amount}>
              R$ {(tx.installment_amount / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Total com Juros</td>
            <td className="detail-total" data-value={tx.total_with_interest}>
              R$ {(tx.total_with_interest / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Taxa</td>
            <td className="detail-fee" data-value={tx.fee_cents}>
              R$ {(tx.fee_cents / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Valor Liquido</td>
            <td className="detail-net" data-value={tx.net_amount}>
              R$ {(tx.net_amount / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Descricao</td>
            <td className="detail-description" data-value={tx.description}>{tx.description}</td>
          </tr>
          <tr>
            <td>Data</td>
            <td className="detail-date" data-value={tx.created_at}>
              {new Date(tx.created_at).toLocaleString('pt-BR')}
            </td>
          </tr>
        </tbody>
      </table>

      {tx.status === 'approved' && (
        <button className="btn-refund" onClick={handleRefund}>
          Estornar
        </button>
      )}
    </div>
  )
}
