import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function brl(c) { return (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function dt(iso)  { return new Date(iso).toLocaleString('pt-BR',{dateStyle:'long',timeStyle:'short'}) }

function Row({ label, cls, val, children, color }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${cls || ''}`} data-value={val} style={color ? {color} : {}}>
        {children}
      </span>
    </div>
  )
}

export default function TransactionDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [tx, setTx]     = useState(null)
  const [err, setErr]   = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then(r => { if (!r.ok) throw 0; return r.json() })
      .then(setTx)
      .catch(() => setErr(true))
  }, [id])

  async function refund() {
    if (!confirm('Confirmar estorno?')) return
    setBusy(true)
    const r = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
    const d = await r.json()
    if (r.ok) setTx(d); else alert(d.error)
    setBusy(false)
  }

  if (err) return (
    <>
      <Navbar />
      <div className="page"><div className="empty">Transação não encontrada.</div></div>
    </>
  )

  if (!tx) return (
    <>
      <Navbar />
      <div className="page"><div className="spinner" /></div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}>
          <button className="btn-ghost" onClick={() => nav(-1)}>← Voltar</button>
          <h1 style={{margin:0, fontSize:18}}>Transação</h1>
          <span className={`badge ${tx.status} detail-status`} data-value={tx.status}>{tx.status}</span>
        </div>

        <div className="card">
          <div className="detail-rows">
            <Row label="ID"            cls="detail-id"           val={tx.id}>{tx.id}</Row>
            <Row label="Descrição"     cls="detail-description"  val={tx.description}>{tx.description}</Row>
            <Row label="Titular"       cls="detail-holder"       val={tx.holder_name}>{tx.holder_name}</Row>
            <Row label="Cartão"        cls="detail-card"         val={tx.card_last4}>****{tx.card_last4}</Row>
            <Row label="Bandeira"      cls="detail-brand"        val={tx.card_brand}>{tx.card_brand}</Row>
            <Row label="Data"          cls="detail-date"         val={tx.created_at}>{dt(tx.created_at)}</Row>
            <Row label="Valor original" cls="detail-amount"      val={tx.amount_cents}>{brl(tx.amount_cents)}</Row>
            <Row label="Parcelas"      cls="detail-installments" val={tx.installments}>{tx.installments}×</Row>
            <Row label="Valor/parcela" cls="detail-installment-amount" val={tx.installment_amount}>{brl(tx.installment_amount)}</Row>
            <Row label="Total c/ juros" cls="detail-total"       val={tx.total_with_interest}>{brl(tx.total_with_interest)}</Row>
            <Row label="Taxa bandeira" cls="detail-fee"          val={tx.fee_cents} color="var(--red)">− {brl(tx.fee_cents)}</Row>
            <Row label="Valor líquido" cls="detail-net"          val={tx.net_amount} color="var(--green)">{brl(tx.net_amount)}</Row>
          </div>

          {tx.status === 'approved' && (
            <div style={{marginTop:20}}>
              <button className="btn-refund" onClick={refund} disabled={busy}>
                {busy ? 'Processando…' : 'Solicitar estorno'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
