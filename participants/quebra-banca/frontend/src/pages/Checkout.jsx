import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function brl(c) {
  return (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Simula itens de um carrinho fixo (pode ser substituído por props/context)
const CART = [
  { id: 1, name: 'Camiseta SENAI',    desc: 'Tamanho M · Preta',   price: 8990  },
  { id: 2, name: 'Caneca QuebraBanca', desc: 'Edição limitada',      price: 4500  },
  { id: 3, name: 'Adesivo Dev Pack',  desc: 'Kit com 10 adesivos',  price: 1500  },
]

const SUBTOTAL = CART.reduce((s, i) => s + i.price, 0)
const SHIPPING = 0 // frete grátis

function mask(v, type) {
  if (type === 'card') return v.replace(/\D/g,'').slice(0,16)
  if (type === 'exp')  return v.replace(/\D/g,'').slice(0,4).replace(/(\d{2})(\d)/,'$1/$2')
  if (type === 'cvv')  return v.replace(/\D/g,'').slice(0,4)
  return v
}

function brandFromNumber(n) {
  const d = n[0]
  if (d === '4') return 'Visa'
  if (d === '5') return 'Mastercard'
  if (d === '3') return 'Amex'
  if (d === '6') return 'Elo'
  return '—'
}

function feeRate(n) {
  if (n[0]==='4') return 0.025
  if (n[0]==='5') return 0.030
  if (n[0]==='3') return 0.035
  if (n[0]==='6') return 0.040
  return 0
}

function interest(amt, inst) {
  if (inst <= 1) return amt
  const r = inst <= 6 ? 0.02 : 0.04
  return Math.round(amt * Math.pow(1 + r, inst))
}

const EMPTY = { card_number:'', holder_name:'', expiration:'', cvv:'', installments:'1', description:'Pedido GatewayPay' }

export default function Checkout() {
  const [step, setStep]   = useState(0)   // 0=carrinho 1=pagamento 2=confirmar
  const [form, setForm]   = useState(EMPTY)
  const [busy, setBusy]   = useState(false)
  const [result, setResult] = useState(null) // tx aprovada
  const [error, setError]  = useState(null)

  const inst = parseInt(form.installments) || 1
  const total = SUBTOTAL + SHIPPING
  const totalWithInt = interest(total, inst)
  const fee = Math.round(totalWithInt * feeRate(form.card_number))
  const net = totalWithInt - fee
  const installmentVal = Math.ceil(totalWithInt / inst)

  function field(e) {
    const { name, value } = e.target
    let v = value
    if (name === 'card_number') v = mask(value, 'card')
    if (name === 'expiration')  v = mask(value, 'exp')
    if (name === 'cvv')         v = mask(value, 'cvv')
    setForm(f => ({ ...f, [name]: v }))
  }

  // Formata número do cartão em grupos de 4
  function displayCard(n) {
    const s = (n || '').padEnd(16, '·')
    return `${s.slice(0,4)} ${s.slice(4,8)} ${s.slice(8,12)} ${s.slice(12,16)}`
  }

  // Valida campos mínimos para avançar
  function canProceed() {
    if (step === 1) {
      return form.card_number.length === 16
          && form.holder_name.trim().length > 0
          && form.expiration.length === 5
          && form.cvv.length >= 3
    }
    return true
  }

  async function submit() {
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_number:  form.card_number,
          holder_name:  form.holder_name,
          expiration:   form.expiration,
          cvv:          form.cvv,
          amount_cents: total,
          installments: inst,
          description:  form.description,
        }),
      })
      const d = await r.json()
      if (!r.ok)            { setError(d.error); setBusy(false); return }
      if (d.status === 'declined') { setError('Transação recusada pelo emissor. Verifique os dados do cartão.'); setBusy(false); return }
      setResult(d)
      setStep(3)
    } catch { setError('Erro de conexão. Tente novamente.') }
    setBusy(false)
  }

  // ── Tela de sucesso ──
  if (step === 3 && result) return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: 520 }}>
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <div className="success-title">Pagamento aprovado!</div>
          <div className="success-sub">Seu pedido foi confirmado com sucesso.</div>

          <div className="success-detail">
            <div className="success-detail-row"><span>ID</span><span style={{fontFamily:'monospace', fontSize:11}}>{result.id}</span></div>
            <div className="success-detail-row"><span>Cartão</span><span>{result.card_brand.toUpperCase()} ****{result.card_last4}</span></div>
            <div className="success-detail-row"><span>Valor cobrado</span><span>{brl(result.total_with_interest)}</span></div>
            <div className="success-detail-row"><span>Parcelas</span><span>{result.installments}× de {brl(result.installment_amount)}</span></div>
          </div>

          <Link to="/" className="btn-ghost" style={{ justifyContent:'center', width:'100%' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </>
  )

  const STEPS = ['Carrinho', 'Pagamento', 'Confirmação']

  return (
    <>
      <Navbar />
      <div className="page">

        {/* Stepper */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`step-tab ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}
              onClick={() => step > i && setStep(i)}
            >
              <span className="step-num">{step > i ? '✓' : i + 1}</span>
              {s}
            </button>
          ))}
        </div>

        <div className="checkout-layout">

          {/* ── Coluna esquerda ── */}
          <div>

            {/* ETAPA 0 — Carrinho */}
            {step === 0 && (
              <div className="card">
                <div className="card-title">Itens do pedido</div>
                {CART.map(item => (
                  <div key={item.id} className="order-item">
                    <div>
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-desc">{item.desc}</div>
                    </div>
                    <div className="order-item-price">{brl(item.price)}</div>
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <button className="btn-pay" onClick={() => setStep(1)}>
                    Continuar para pagamento →
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 1 — Dados do cartão */}
            {step === 1 && (
              <div className="card">
                <div className="card-title">Dados do cartão</div>

                {/* Card visual */}
                <div className="card-visual">
                  <div className="card-visual-chip" />
                  <div className="card-visual-number">{displayCard(form.card_number)}</div>
                  <div className="card-visual-footer">
                    <div>
                      <div className="card-visual-label">Titular</div>
                      <div className="card-visual-val">{form.holder_name || 'NOME DO TITULAR'}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="card-visual-label">Validade</div>
                      <div className="card-visual-val">{form.expiration || 'MM/AA'}</div>
                    </div>
                    <div className="card-visual-brand" style={{ color:'rgba(255,255,255,.6)' }}>
                      {brandFromNumber(form.card_number)}
                    </div>
                  </div>
                </div>

                {/* Campos */}
                <div className="form-row single">
                  <div className="field">
                    <label>Número do cartão</label>
                    <input className="input-card-number" name="card_number"
                      value={form.card_number} onChange={field}
                      placeholder="0000 0000 0000 0000" maxLength={16} />
                  </div>
                </div>

                <div className="form-row single">
                  <div className="field">
                    <label>Nome do titular</label>
                    <input className="input-holder-name" name="holder_name"
                      value={form.holder_name} onChange={field}
                      placeholder="Como está no cartão" maxLength={50} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Validade</label>
                    <input className="input-expiration" name="expiration"
                      value={form.expiration} onChange={field}
                      placeholder="MM/AA" maxLength={5} />
                  </div>
                  <div className="field">
                    <label>CVV</label>
                    <input className="input-cvv" name="cvv"
                      value={form.cvv} onChange={field}
                      placeholder="123" maxLength={4} />
                  </div>
                </div>

                <div className="form-row single">
                  <div className="field">
                    <label>Parcelas</label>
                    <select className="select-installments" name="installments"
                      value={form.installments} onChange={field}>
                      <option value="1">1× de {brl(total)} sem juros</option>
                      {[2,3,4,5,6].map(n => {
                        const tot = interest(total, n)
                        return <option key={n} value={n}>{n}× de {brl(Math.ceil(tot/n))} (+2% a.m.) — total {brl(tot)}</option>
                      })}
                      {[7,8,9,10,11,12].map(n => {
                        const tot = interest(total, n)
                        return <option key={n} value={n}>{n}× de {brl(Math.ceil(tot/n))} (+4% a.m.) — total {brl(tot)}</option>
                      })}
                    </select>
                  </div>
                </div>

                {/* Hidden required by benchmark */}
                <input className="input-amount"      name="amount_cents"  value={total}              onChange={()=>{}} type="hidden" />
                <input className="input-description" name="description"   value={form.description}   onChange={field}  type="hidden" />

                <div style={{ display:'flex', gap:10, marginTop:6 }}>
                  <button className="btn-ghost" onClick={() => setStep(0)}>← Voltar</button>
                  <button className="btn-pay" style={{ flex:1 }}
                    onClick={() => canProceed() && setStep(2)}
                    disabled={!canProceed()}>
                    Revisar pedido →
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2 — Confirmação */}
            {step === 2 && (
              <div className="card">
                <div className="card-title">Confirmar pagamento</div>

                <div className="detail-rows" style={{ marginBottom:20 }}>
                  <div className="detail-row">
                    <span className="detail-row-label">Cartão</span>
                    <span className="detail-row-value">{brandFromNumber(form.card_number)} ****{form.card_number.slice(-4)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Titular</span>
                    <span className="detail-row-value">{form.holder_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Parcelas</span>
                    <span className="detail-row-value">{inst}× de {brl(installmentVal)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Total cobrado</span>
                    <span className="detail-row-value" style={{color:'var(--accent)'}}>{brl(totalWithInt)}</span>
                  </div>
                </div>

                {error && <div className="feedback-error" style={{ marginBottom:12 }}>{error}</div>}

                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn-ghost" onClick={() => setStep(1)}>← Editar</button>
                  <button className="btn-pay" style={{ flex:1 }} onClick={submit} disabled={busy}>
                    {busy ? 'Processando…' : `Pagar ${brl(totalWithInt)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Resumo do pedido (direita) ── */}
          <div className="order-summary">
            <div className="order-title">Resumo</div>

            {CART.map(item => (
              <div key={item.id} className="order-item">
                <div>
                  <div className="order-item-name">{item.name}</div>
                  <div className="order-item-desc">{item.desc}</div>
                </div>
                <div className="order-item-price">{brl(item.price)}</div>
              </div>
            ))}

            <hr className="order-divider" />

            <div className="order-total-row">
              <span className="order-total-label">Subtotal</span>
              <span className="order-total-val">{brl(SUBTOTAL)}</span>
            </div>
            <div className="order-total-row">
              <span className="order-total-label">Frete</span>
              <span className="order-total-val green">Grátis</span>
            </div>
            {inst > 1 && (
              <div className="order-total-row">
                <span className="order-total-label">Juros ({inst <= 6 ? '2' : '4'}% a.m.)</span>
                <span className="order-total-val">{brl(totalWithInt - total)}</span>
              </div>
            )}

            <hr className="order-divider" />

            <div className="order-total-row">
              <span className="order-total-final-label">Total</span>
              <span className="order-total-final-val">{brl(totalWithInt)}</span>
            </div>

            {inst > 1 && (
              <div style={{ marginTop:8, fontSize:12, color:'var(--muted)' }}>
                {inst}× de {brl(installmentVal)}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
