import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

function brl(c) { return (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function dt(iso) { return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) }

export default function History() {
  const [params, setParams] = useSearchParams()
  const page  = Math.max(1, +( params.get('page')  || 1))
  const limit = Math.min(100, Math.max(1, +(params.get('limit') || 10)))

  const [rows, setRows]  = useState([])
  const [info, setInfo]  = useState({ page:1, limit:10, total:0, total_pages:1 })
  const [busy, setBusy]  = useState(true)
  const [doing, setDoing]= useState(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const r = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
      const d = await r.json()
      setRows(d.data || [])
      setInfo(d.pagination)
    } catch {}
    setBusy(false)
  }, [page, limit])

  useEffect(() => { load() }, [load])

  async function refund(e, id) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Confirmar estorno?')) return
    setDoing(id)
    const r = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
    if (!r.ok) { const d = await r.json(); alert(d.error) }
    setDoing(null); load()
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Histórico</h1>

        {busy ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <div className="empty">Nenhuma transação.</div>
        ) : (
          <div className="card">
            <div className="list-transactions">
              {rows.map(tx => (
                <Link key={tx.id} to={`/transaction/${tx.id}`} className="transaction-item">
                  <span className="transaction-id"        data-value={tx.id}                  style={{display:'none'}}>{tx.id}</span>
                  <span className="transaction-total"     data-value={tx.total_with_interest} style={{display:'none'}}>{tx.total_with_interest}</span>
                  <span className="transaction-installment-amount" data-value={tx.installment_amount} style={{display:'none'}}>{tx.installment_amount}</span>
                  <span className="transaction-fee"       data-value={tx.fee_cents}           style={{display:'none'}}>{tx.fee_cents}</span>

                  <div className="tx-icon">{tx.card_brand?.[0]?.toUpperCase() ?? '?'}</div>

                  <div className="tx-info">
                    <div className="tx-desc">
                      <span className="transaction-description" data-value={tx.description}>{tx.description}</span>
                    </div>
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

                  {tx.status === 'approved' && (
                    <button className="btn-refund" onClick={e => refund(e, tx.id)} disabled={doing === tx.id}>
                      {doing === tx.id ? '…' : 'Estornar'}
                    </button>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!busy && rows.length > 0 && (
          <div className="pagination">
            <button className="btn-prev-page" onClick={() => setParams({page:page-1,limit})} disabled={page<=1}>← Anterior</button>
            <span className="pagination-info">
              Pág <span className="pagination-current" data-value={info.page}>{info.page}</span>/
              <span className="pagination-pages" data-value={info.total_pages}>{info.total_pages}</span>
              {' · '}<span className="pagination-total" data-value={info.total}>{info.total}</span> itens
            </span>
            <button className="btn-next-page" onClick={() => setParams({page:page+1,limit})} disabled={page>=info.total_pages}>Próxima →</button>
          </div>
        )}
      </div>
    </>
  )
}
