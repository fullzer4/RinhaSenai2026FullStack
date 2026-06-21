import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PaymentForm from '../components/PaymentForm'
import Balance from '../components/Balance'
import Feedback from '../components/Feedback'
import '../styles/Dashboard.css'

const API_URL = 'http://localhost:3000/api'

export default function Dashboard() {
  const [feedback, setFeedback] = useState(null)
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/balance`)
      const data = await res.json()
      setBalance(data)
    } catch (error) {
      console.error('Erro ao buscar saldo:', error)
    }
  }

  const handlePayment = async (formData) => {
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_number: formData.cardNumber.replace(/\s/g, ''),
          holder_name: formData.cardName,
          expiration: formData.expiry,
          cvv: formData.cvv,
          amount_cents: Math.round(parseFloat(formData.amount) * 100),
          installments: parseInt(formData.installments) || 1,
          description: formData.description || 'Transação'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFeedback({ type: 'success', message: '✓ Transação aprovada!' })
        fetchBalance()
        setTimeout(() => navigate(`/transaction/${data.id}`), 1000)
      } else {
        setFeedback({ type: 'error', message: `✗ ${data.message || 'Transação recusada'}` })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: '✗ Erro ao processar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <PaymentForm onSubmit={handlePayment} loading={loading} />
        <div className="right-panel">
          {feedback && <Feedback feedback={feedback} />}
          {balance && <Balance balance={balance} />}
        </div>
      </div>
    </div>
  )
}