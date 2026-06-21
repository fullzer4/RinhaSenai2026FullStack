import '../styles/Balance.css'

export default function Balance({ balance }) {
  return (
    <div className="balance-card">
      <h4>Saldo</h4>
      <div className="balance-grid">
        <div className="balance-item">
          <span className="balance-label">Líquido</span>
          <span className="balance-value" data-value={balance.balance_cents}>
            R$ {(balance.balance_cents / 100).toFixed(2)}
          </span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Aprovadas</span>
          <span className="balance-count" data-value={balance.total_approved}>
            {balance.total_approved}
          </span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Recusadas</span>
          <span className="balance-count" data-value={balance.total_declined}>
            {balance.total_declined}
          </span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Estornadas</span>
          <span className="balance-count" data-value={balance.total_refunded}>
            {balance.total_refunded}
          </span>
        </div>
      </div>
    </div>
  )
}