import { useState, useEffect } from 'react'
import './styles/dashboard.css'

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


      if(res.status === 201) {
        const data = await res.json()
        setFeedback({ type: 'sucess', message: `Pagamento aprovado! ID: ${data.id}`})


        const balanceRes = await fetch ('/api/balance')
        const balanceData = await balanceRes.json()
        setBalance(balanceData)


        setCardNumber ('')
        setHolderName('')
        setExpiration('')
        setCvv('')
        setAmount('')
        setInstallments('1')
        setDescription('')
      } else if (res.status === 422) {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.error || 'Dados inválidos'})
      } else {
        const data = await res.json()
        if (data.status === 'declined') {
          setFeedback({ type: 'error', message: 'Transação recusada'})
        } else {
          setFeedback({ type: 'error', message: 'Erro desconhecido'})
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão'})
    }
  }


  return(
    <div>
      <h1>Gateway de Pagamento</h1>


      {/*Feedback*/}
      {feedback && (
        <div className={feedback.type === 'sucess' ? 'feedback-success' : 'feedback-error'}>
          {feedback.message}
          </div>
      )}


      {/*Formulário*/}
      < form onSubmit={handleSubmit}>
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
          <label>Valor (centavos):</label>
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

        <hr />

        {/* Saldo */}
        <h2>Resumo do Saldo</h2>
        {balance ? (
          <div>
            <p>
              Saldo líquido:{ '' }
              <span className="display-balance" data-value={balance.balance_cents}>
                R$ {(balance.balance_cents / 100).toFixed(2)}
              </span>
            </p>

            <p>
              Total aprovadas: { ' '}
              <span className="display-balance" data-value={balance.total_approved}>
              {balance.total_approved}
              </span>
            </p>

            <p>
              Total recusadas: {' '}
              <span className="display-total-declined" data-value={balance.total_declined}>
                {balance.total_declined}
              </span>
            </p>


            <p>
              Total estornadas: { ' ' }
              <span className="display-total-refunded" data-value={balance.total_refunded}>
                {balance.total_refunded}
              </span>
            </p>
            </div>
        ) : (
          <p>Carregando saldo...</p>
        )}
    </div>
  )
}

