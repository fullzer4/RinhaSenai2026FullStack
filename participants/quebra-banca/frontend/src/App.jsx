import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './components/Navbar'

const ICONS = { visa: '💳', mastercard: '💳', amex: '💳', elo: '💳' }

function brl(c) { return (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function dt(iso) { return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) }

const EMPTY = { card_number:'', holder_name:'', expiration:'', cvv:'', amount_cents:'', installments:1, description:'' }

export default function App() {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState(null)
  const [bal, setBal]   = useState(null)
  const [txs, setTxs]   = useState([])

  const load = useCallback(async () => {
    const [b, t] = await Promise.all([
      fetch('/api/balance').then(r => r.json()).catch(() => null),
      fetch('/api/transactions?limit=6').then(r => r.json()).catch(() => null),
    ])
    if (b) setBal(b)
    if (t) setTxs(t.data || [])
  }, [])

  useEffect(() => { load() }, [load])

  function set(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function pay() {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount_cents: +form.amount_cents, installments: +form.installments }),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg({ ok: false, text: d.error })
      } else if (d.status === 'declined') {
        setMsg({ ok: false, text: 'Transação recusada pelo emissor.' })
        load()
      } else {
        setMsg({ ok: true, text: `Aprovado — ${brl(d.amount_cents)} em ${d.installments}x` })
        setForm(EMPTY); load()
      }
    } catch { setMsg({ ok: false, text: 'Erro de conexão.' }) }
    setBusy(false)
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Dashboard</h1>

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Saldo líquido</div>
            <div className="stat-val green display-balance" data-value={bal?.balance_cents ?? 0}>
              {bal ? brl(bal.balance_cents) : '—'}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Aprovadas</div>
            <div className="stat-val display-total-approved" data-value={bal?.total_approved ?? 0}>{bal?.total_approved ?? '—'}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Recusadas</div>
            <div className="stat-val red display-total-declined" data-value={bal?.total_declined ?? 0}>{bal?.total_declined ?? '—'}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Estornadas</div>
            <div className="stat-val yellow display-total-refunded" data-value={bal?.total_refunded ?? 0}>{bal?.total_refunded ?? '—'}</div>
          </div>
        </div>

        {/* Form */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">Nova transação</div>

          <div className="form-row single">
            <div className="field">
              <label>Número do cartão</label>
              <input className="input-card-number" name="card_number" value={form.card_number} onChange={set} placeholder="0000000000000000" maxLength={16} />
            </div>
          </div>

          <div className="form-row single">
            <div className="field">
              <label>Nome do titular</label>
              <input className="input-holder-name" name="holder_name" value={form.holder_name} onChange={set} placeholder="João Silva" maxLength={50} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Validade</label>
              <input className="input-expiration" name="expiration" value={form.expiration} onChange={set} placeholder="MM/AA" maxLength={5} />
            </div>
            <div className="field">
              <label>CVV</label>
              <input className="input-cvv" name="cvv" value={form.cvv} onChange={set} placeholder="123" maxLength={4} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Valor em centavos</label>
              <input className="input-amount" name="amount_cents" type="number" value={form.amount_cents} onChange={set} placeholder="ex: 10000 = R$100" />
            </div>
            <div className="field">
              <label>Parcelas</label>
              <select className="select-installments" name="installments" value={form.installments} onChange={set}>
                <option value={1}>1× sem juros</option>
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}× (+2% a.m.)</option>)}
                {[7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}× (+4% a.m.)</option>)}
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="field">
              <label>Descrição</label>
              <input className="input-description" name="description" value={form.description} onChange={set} placeholder="Camiseta SENAI" maxLength={100} />
            </div>
          </div>

          <button className="btn-pay" onClick={pay} disabled={busy}>
            {busy ? 'Processando…' : 'Pagar'}
          </button>

          {msg && (
            <div className={msg.ok ? 'feedback-success' : 'feedback-error'}>{msg.text}</div>
          )}
        </div>

        {/* Recentes */}
        {txs.length > 0 && (
          <div className="card">
            <div className="card-title">Recentes</div>
            <div className="list-transactions">
              {txs.map(tx => (
                <Link key={tx.id} to={`/transaction/${tx.id}`} className="transaction-item">
                  <div className="tx-icon">{tx.card_brand?.[0]?.toUpperCase() ?? '?'}</div>
                  <div className="tx-info">
                    <div className="tx-desc transaction-description" data-value={tx.description}>{tx.description}</div>
                    <div className="tx-sub">
                      <span className={`badge ${tx.status} transaction-status`} data-value={tx.status}>{tx.status}</span>
                      <span className="transaction-brand" data-value={tx.card_brand}>{tx.card_brand}</span>
                      <span>****<span className="transaction-card" data-value={tx.card_last4}>{tx.card_last4}</span></span>
                      <span className="transaction-date" data-value={tx.created_at}>{dt(tx.created_at)}</span>
                    </div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-val transaction-amount" data-value={tx.amount_cents}>{brl(tx.amount_cents)}</div>
                    <div className="tx-sub-r">
                      <span className="transaction-installments" data-value={tx.installments}>{tx.installments}</span>x
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <Link to="/history" className="btn-ghost">Ver histórico completo →</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
