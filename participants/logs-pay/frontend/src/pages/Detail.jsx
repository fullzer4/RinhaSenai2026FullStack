import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'

const statusLabel = (s) => ({ approved: 'Aprovada', declined: 'Recusada', refunded: 'Estornada' }[s] || s)

const brandIcon = (brand) => {
  const icons = { visa: '💳 Visa', mastercard: '💳 Mastercard', amex: '💳 Amex', elo: '💳 Elo' }
  return icons[brand] || `💳 ${brand}`
}

export default function Detail() {
  const { id } = useParams()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/transactions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTx(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!confirm('Deseja realmente estornar esta transação?')) return
    setRefunding(true)
    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        fetchDetail()
      } else {
        alert('Erro ao estornar')
      }
    } catch (e) {
      alert('Erro de conexão')
    } finally {
      setRefunding(false)
    }
  }

  const formatCurrency = (cents) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Detalhes da Transação</h1>
        </div>
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Carregando transação...</p>
        </div>
      </div>
    )
  }

  if (!tx) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Detalhes da Transação</h1>
        </div>
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Transação não encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>O ID informado não existe ou foi removido.</p>
          <Link to="/history" style={{ display: 'inline-block', background: 'var(--neon-green)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Voltar ao Histórico
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/history" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            ← Voltar ao Histórico
          </Link>
          <h1 className="page-title">Detalhes da Transação</h1>
        </div>
        <span className={`badge badge-${tx.status} detail-status`} data-value={tx.status} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          {statusLabel(tx.status)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Card Info */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Informações do Cartão</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Titular</p>
                <p className="detail-holder" data-value={tx.holder_name} style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tx.holder_name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Bandeira & Final</p>
                <p style={{ fontWeight: 600 }}>
                  <span className="detail-brand" data-value={tx.card_brand}>{brandIcon(tx.card_brand)}</span>
                  {' '}<span className="detail-card" data-value={tx.card_last4} style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>•••• {tx.card_last4}</span>
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Data da Transação</p>
                <p className="detail-date" data-value={tx.created_at}>{new Date(tx.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>ID da Transação</p>
                <p className="detail-id" data-value={tx.id} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{tx.id}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Descrição do Pedido</p>
            <p className="detail-description" data-value={tx.description} style={{ fontSize: '1rem', fontWeight: 500 }}>{tx.description}</p>
          </div>

          {/* Actions */}
          {tx.status === 'approved' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--danger)', marginBottom: '0.5rem' }}>Zona de Risco</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                O estorno é irreversível. O valor será devolvido ao cliente e o saldo atualizado.
              </p>
              <button
                className="btn-outline btn-refund"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={handleRefund}
                disabled={refunding}
              >
                {refunding ? 'Estornando...' : '↩ Estornar Transação'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Values */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Resumo Financeiro</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Valor Original</span>
              <span className="detail-amount" data-value={tx.amount_cents}>{formatCurrency(tx.amount_cents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Parcelas</span>
              <span className="detail-installments" data-value={tx.installments}>
                {tx.installments}× de <span className="detail-installment-amount" data-value={tx.installment_amount}>{formatCurrency(tx.installment_amount)}</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total c/ Juros</span>
              <span className="detail-total" data-value={tx.total_with_interest}>{formatCurrency(tx.total_with_interest)}</span>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
              <span>Taxa do Gateway</span>
              <span className="detail-fee" data-value={tx.fee_cents}>− {formatCurrency(tx.fee_cents)}</span>
            </div>

            <div style={{ height: '1px', borderTop: '1px dashed var(--border-color)', margin: '0.25rem 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
              <span>Líquido</span>
              <span className="detail-net" data-value={tx.net_amount} style={{ color: 'var(--neon-green)' }}>
                {formatCurrency(tx.net_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
