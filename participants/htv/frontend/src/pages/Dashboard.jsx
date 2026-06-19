import { useState, useEffect } from 'react'
import '../styles/dashboard.css'

export default function Dashboard() {


  const [cardNumber, setCardNumber] = useState ('')
  const [holderName, setHolderName] = useState ('')
  const [expiration, setExpiration] = useState ('')
  const [cvv, setCvv] = useState ('')
  const [amount, setAmount] = useState ('')
  const [installments, setInstallments] = useState ('')
  const [description, setDescription] = useState ('')


  const [feedback, setFeedback] = useState (null)


  const [balance, setBalance] = useState (null)


  useEffect(() => {
    fetch('/api/balance')
      .then(res => res.json())
      .then(data => setBalance(data))
      .catch(err => console.error('Erro ao buscar saldo:', err))
  }, [])


  async function handleSubmit(e){
    e.preventDefault()


    const body = {
      card_number: cardNumber,
      holder_name: holderName,
      expiration: expiration,
      cvv: cvv,
      amount_cents: Number(amount),
      installments: Number(installments),
      description: description
    }


    try{
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })


      if (res.status === 201) {
        const data = await res.json()

        // Verifica o status real da transação, não apenas o HTTP status
        if (data.status === 'declined') {
          setFeedback({ type: 'error', message: 'Transação recusada' })
        } else {
          setFeedback({ type: 'success', message: `Pagamento aprovado! ID: ${data.id}` })
        }

        const balanceRes = await fetch('/api/balance')
        const balanceData = await balanceRes.json()
        setBalance(balanceData)

        setCardNumber('')
        setHolderName('')
        setExpiration('')
        setCvv('')
        setAmount('')
        setInstallments('1')
        setDescription('')
      } else if (res.status === 422) {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.error || 'Dados inválidos' })
      } else {
        // Trata erros 500 ou respostas inesperadas de forma segura
        try {
          const data = await res.json()
          setFeedback({ type: 'error', message: data.error || 'Erro desconhecido' })
        } catch {
          setFeedback({ type: 'error', message: `Erro do servidor (${res.status})` })
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão'})
    }
  }


  return(
    <div className="dashboard-container">
      <h1>Gateway de Pagamento</h1>


      {/*Feedback*/}
      {feedback && (
        <div className={feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}>
          {feedback.message}
          </div>
      )}


      {/*Formulário*/}
      <form className="dashboard-form" onSubmit={handleSubmit}>
      <div>
        <label>Número do cartão:</label>
        <input
        className = "input-card-number"
        value = {cardNumber}
        onChange ={e => setCardNumber(e.target.value)}
        placeholder="0000 0000 0000 0000"
        />
        </div>

        <div>
          <label>Nome do titular:</label>
          <input
          className="input-holder-name"
          value={holderName}
          onChange={e => setHolderName(e.target.value)}
          placeholder = "João Silva"
        />
        </div>

        <div>

          <label>Validade (MM/AA)</label>
          <input
          className = "input-expiration"
          value = {expiration}
          onChange={e => setExpiration(e.target.value)}
          placeholder="12/28"
          />
        </div>
        <div>
          <label>CVV</label>
          <input
          className = "input-cvv"
          value ={cvv}
          onChange={e => setCvv(e.target.value)}
          placeholder="123"
          />
        </div>

        <div>
          <label>Valor (em centavos — ex: R$150,00 = 15000):</label>
          <input
          className="input-amount"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="15000"
          />
        </div>
        <div>
          <label>Parcelas:</label>
          <select
          className ="select-installments"
          value={installments}
          onChange={e => setInstallments(e.target.value)}
          >
            {Array.from({ length: 12}, (_,i) => i + 1).map(n=> (
              <option key={n} value={n}>{n}x</option>
            ))}
            </select>
        </div>
        <div>
          <label>Descrição</label>
          <input
          className ="input-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder ="Camiseta SENAI"
          />
        </div>
        <button className = "btn-pay" type="submit">Pagar</button>
        </form>

        <hr className="dashboard-divider" />

        {/* Saldo */}
        <h2>Resumo do Saldo</h2>
        {balance ? (
          <div className="balance-grid">
            <p>
              Saldo líquido:{ ' ' }
              <span className="display-balance" data-value={balance.balance_cents ?? 0}>
                R$ {((balance.balance_cents ?? 0) / 100).toFixed(2)}
              </span>
            </p>

            <p>
              Total aprovadas: { ' '}
              <span className="display-total-approved" data-value={balance.total_approved ?? 0}>
              {balance.total_approved ?? 0}
              </span>
            </p>

            <p>
              Total recusadas: {' '}
              <span className="display-total-declined" data-value={balance.total_declined ?? 0}>
                {balance.total_declined ?? 0}
              </span>
            </p>


            <p>
              Total estornadas: { ' ' }
              <span className="display-total-refunded" data-value={balance.total_refunded ?? 0}>
                {balance.total_refunded ?? 0}
              </span>
            </p>
            </div>
        ) : (
          <p>Carregando saldo...</p>
        )}
    </div>
  )
}