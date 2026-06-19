import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [balance, setBalance] = useState({ balance_cents: 0, total_approved: 0, total_declined: 0, total_refunded: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  
  const [formData, setFormData] = useState({
    card_number: '',
    holder_name: '',
    expiration: '',
    cvv: '',
    amount_cents: '',
    installments: 1,
    description: ''
  })

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/balance')
      if (res.ok) {
        const data = await res.json()
        setBalance(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '')
    const limited = digits.substring(0, 16)
    return limited.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiration = (value) => {
    const digits = value.replace(/\D/g, '')
    const limited = digits.substring(0, 4)
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}/${limited.substring(2, 4)}`
    }
    return limited
  }

  const formatCVV = (value) => {
    return value.replace(/\D/g, '').substring(0, 3)
  }

  const formatAmount = (value) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const cents = parseInt(digits, 10)
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cents / 100)
    return `R$ ${formatted}`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'card_number') {
      formattedValue = formatCardNumber(value)
    } else if (name === 'expiration') {
      formattedValue = formatExpiration(value)
    } else if (name === 'cvv') {
      formattedValue = formatCVV(value)
    } else if (name === 'amount_cents') {
      formattedValue = formatAmount(value)
    }

    setFormData({ ...formData, [name]: formattedValue })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const payload = {
        ...formData,
        card_number: formData.card_number.replace(/\s+/g, ''),
        amount_cents: parseInt(formData.amount_cents.replace(/\D/g, ''), 10),
        installments: parseInt(formData.installments, 10)
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (res.ok) {
        setFeedback({ type: 'success', message: `Transação ${data.status}! ID: ${data.id.substring(0, 8)}` })
        setFormData({ card_number: '', holder_name: '', expiration: '', cvv: '', amount_cents: '', installments: 1, description: '' })
        fetchBalance()
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro na transação' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Financeiro</h1>
      </div>

      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <span className="stat-label">Saldo Disponível</span>
          {loading ? <span>...</span> : (
            <span className="stat-value display-balance" data-value={balance.balance_cents}>
              {formatCurrency(balance.balance_cents)}
            </span>
          )}
        </div>
        <div className="glass-panel stat-card stat-warning">
          <span className="stat-label">Total Aprovadas</span>
          {loading ? <span>...</span> : (
            <span className="stat-value display-total-approved" data-value={balance.total_approved}>
              {balance.total_approved}
            </span>
          )}
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-label">Total Recusadas</span>
          {loading ? <span>...</span> : (
            <span className="stat-value display-total-declined" data-value={balance.total_declined}>
              {balance.total_declined}
            </span>
          )}
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-label">Total Estornadas</span>
          {loading ? <span>...</span> : (
            <span className="stat-value display-total-refunded" data-value={balance.total_refunded}>
              {balance.total_refunded}
            </span>
          )}
        </div>
      </div>

      <div className="tabs">
        <div className="tab-item active">Nova Transação</div>
      </div>

      <div className="transaction-layout">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Completar Transação</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Preencha os dados abaixo para simular um pagamento no gateway LogsPay.
          </p>
          
          {feedback && (
            <div className={`feedback-msg ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número do Cartão</label>
              <input name="card_number" type="text" className="form-input input-card-number" required value={formData.card_number} onChange={handleChange} placeholder="0000 0000 0000 0000" maxLength="19" />
            </div>
            
            <div className="form-group">
              <label>Nome do Titular</label>
              <input name="holder_name" type="text" className="form-input input-holder-name" required value={formData.holder_name} onChange={handleChange} placeholder="JOAO SILVA" style={{ textTransform: 'uppercase' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Validade (MM/YY)</label>
                <input name="expiration" type="text" className="form-input input-expiration" required value={formData.expiration} onChange={handleChange} placeholder="12/28" maxLength="5" />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input name="cvv" type="text" className="form-input input-cvv" required value={formData.cvv} onChange={handleChange} placeholder="123" maxLength="3" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Valor (Reais)</label>
                <input name="amount_cents" type="text" className="form-input input-amount" required value={formData.amount_cents} onChange={handleChange} placeholder="R$ 150,00" />
              </div>
              <div className="form-group">
                <label>Parcelas</label>
                <select name="installments" className="form-input select-installments" value={formData.installments} onChange={handleChange}>
                  {[...Array(12).keys()].map(i => (
                    <option key={i+1} value={i+1}>{i+1}x</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <input name="description" type="text" className="form-input input-description" required value={formData.description} onChange={handleChange} placeholder="Camiseta SENAI" />
            </div>

            <button type="submit" className="btn-primary btn-pay" disabled={submitting} style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
              {submitting ? 'Processando...' : 'Efetuar Pagamento'}
            </button>
          </form>
        </div>

        <div>
          <div className="cc-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="cc-chip"></div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', fontWeight: 'bold' }}>LogsPay</div>
            </div>
            <div className="cc-number">
              {formData.card_number || '0000 0000 0000 0000'}
            </div>
            <div className="cc-footer">
              <div className="cc-holder">
                <span className="cc-label">Titular do Cartão</span>
                <span className="cc-name">{formData.holder_name || 'SEU NOME AQUI'}</span>
              </div>
              <div className="cc-expires">
                <span className="cc-label">Validade</span>
                <span className="cc-date">{formData.expiration || 'MM/YY'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
