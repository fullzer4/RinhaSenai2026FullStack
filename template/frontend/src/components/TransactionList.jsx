import { Link } from 'react-router'

export default function TransactionList({ data, onRefund }) {
  if (!data || data.length === 0) {
    return <p>Nenhuma transacao encontrada.</p>
  }

  return (
    <table className="list-transactions">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Valor</th>
          <th>Bandeira</th>
          <th>Parcelas</th>
          <th>Parcela</th>
          <th>Total</th>
          <th>Taxa</th>
          <th>Descricao</th>
          <th>Cartao</th>
          <th>Data</th>
          <th>Acoes</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tx) => (
          <tr key={tx.id} className="transaction-item">
            <td className="transaction-id" data-value={tx.id}>
              <Link to={`/transaction/${tx.id}`}>{tx.id.slice(0, 8)}...</Link>
            </td>
            <td className="transaction-status" data-value={tx.status}>
              {tx.status}
            </td>
            <td className="transaction-amount" data-value={tx.amount_cents}>
              R$ {(tx.amount_cents / 100).toFixed(2)}
            </td>
            <td className="transaction-brand" data-value={tx.card_brand}>
              {tx.card_brand}
            </td>
            <td className="transaction-installments" data-value={tx.installments}>
              {tx.installments}x
            </td>
            <td className="transaction-installment-amount" data-value={tx.installment_amount}>
              R$ {(tx.installment_amount / 100).toFixed(2)}
            </td>
            <td className="transaction-total" data-value={tx.total_with_interest}>
              R$ {(tx.total_with_interest / 100).toFixed(2)}
            </td>
            <td className="transaction-fee" data-value={tx.fee_cents}>
              R$ {(tx.fee_cents / 100).toFixed(2)}
            </td>
            <td className="transaction-description" data-value={tx.description}>
              {tx.description}
            </td>
            <td className="transaction-card" data-value={tx.card_last4}>
              **** {tx.card_last4}
            </td>
            <td className="transaction-date" data-value={tx.created_at}>
              {new Date(tx.created_at).toLocaleString('pt-BR')}
            </td>
            <td>
              {tx.status === 'approved' && (
                <button className="btn-refund" onClick={() => onRefund(tx.id)}>
                  Estornar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
