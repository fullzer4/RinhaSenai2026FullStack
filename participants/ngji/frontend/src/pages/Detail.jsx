import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(isoString))
}

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [txn, setTxn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransaction = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/transactions/${id}`)
      if (res.ok) {
        setTxn(await res.json())
      } else {
        setError('Transação não encontrada.')
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  const handleRefund = async () => {
    if (!confirm('Tem certeza que deseja estornar esta transação?')) return

    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        alert('Transação estornada com sucesso!')
        fetchTransaction()
      } else {
        const err = await res.json()
        alert(`Erro ao estornar: ${err.error || 'Desconhecido'}`)
      }
    } catch {
      alert('Erro de conexão ao estornar.')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading"><div className="spinner"></div> Carregando detalhes...</div>
      </div>
    )
  }

  if (error || !txn) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <p>{error || 'Transação não encontrada.'}</p>
          <button className="btn btn-outline" onClick={() => navigate('/history')} style={{marginTop: '1rem'}}>
            Voltar ao Histórico
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Detalhes da Transação</h1>
          <p className="page-subtitle detail-id" data-value={txn.id}>{txn.id}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <div className="detail-section-title">Informações Principais</div>
          
          <div className="detail-highlight detail-amount" data-value={txn.amount_cents}>
            {formatBRL(txn.amount_cents)}
          </div>

          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`badge badge-${txn.status} detail-status`} data-value={txn.status}>
              {txn.status === 'approved' ? 'Aprovada' : txn.status === 'declined' ? 'Recusada' : 'Estornada'}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Data</span>
            <span className="detail-value detail-date" data-value={txn.created_at}>{formatDate(txn.created_at)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Descrição</span>
            <span className="detail-value detail-description" data-value={txn.description}>{txn.description}</span>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Dados do Pagamento</div>
          
          <div className="detail-row">
            <span className="detail-label">Titular</span>
            <span className="detail-value detail-holder" data-value={txn.holder_name}>{txn.holder_name}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Cartão</span>
            <span className="detail-value detail-card" data-value={txn.card_last4}>•••• {txn.card_last4}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Bandeira</span>
            <span className="detail-value badge detail-brand" data-value={txn.card_brand} style={{textTransform: 'capitalize'}}>
              {txn.card_brand}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Parcelamento</span>
            <span className="detail-value detail-installments" data-value={txn.installments}>{txn.installments}x</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Valor da Parcela</span>
            <span className="detail-value detail-installment-amount" data-value={txn.installment_amount}>{formatBRL(txn.installment_amount)}</span>
          </div>
        </div>

        <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
          <div className="detail-section-title">Resumo Financeiro</div>
          
          <div className="detail-grid">
            <div>
              <div className="detail-row">
                <span className="detail-label">Valor Original</span>
                <span className="detail-value">{formatBRL(txn.amount_cents)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total com Juros</span>
                <span className="detail-value detail-total" data-value={txn.total_with_interest}>{formatBRL(txn.total_with_interest)}</span>
              </div>
            </div>
            <div>
              <div className="detail-row">
                <span className="detail-label">Taxa da Bandeira</span>
                <span className="detail-value detail-fee" data-value={txn.fee_cents} style={{color: 'var(--accent-red)'}}>
                  - {formatBRL(txn.fee_cents)}
                </span>
              </div>
              <div className="detail-row" style={{borderTop: '1px solid var(--border-glass)', marginTop: '0.5rem', paddingTop: '0.5rem'}}>
                <span className="detail-label" style={{fontWeight: 600, color: 'var(--text-primary)'}}>Valor Líquido Recebido</span>
                <span className="detail-value detail-net" data-value={txn.net_amount} style={{color: 'var(--accent-emerald)', fontSize: '1.125rem'}}>
                  {formatBRL(txn.net_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-actions">
          {txn.status === 'approved' && (
            <button className="btn btn-danger btn-refund" onClick={handleRefund}>
              ↺ Estornar Transação
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
