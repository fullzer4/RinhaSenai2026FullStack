import { useState } from 'react'
import '../styles/PaymentForm.css'

export default function PaymentForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    amount: '',
    installments: '1',
    description: ''
  })

  const [errors, setErrors] = useState({})

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const formatCVV = (value) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 4)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    let formattedValue = value

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value)
    } else if (name === 'cvv') {
      formattedValue = formatCVV(value)
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Cartão deve ter 16 dígitos'
    }
    if (formData.cardName.length < 3 || formData.cardName.length > 50) {
      newErrors.cardName = 'Nome deve ter entre 3 e 50 caracteres'
    }
    if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Use formato MM/YY'
    }
    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'CVV deve ter 3 ou 4 dígitos'
    }
    if (parseFloat(formData.amount) <= 0 || parseFloat(formData.amount) > 10000) {
      newErrors.amount = 'Valor deve ser entre R$ 0,01 e R$ 10.000,00'
    }
    if (formData.description.length === 0 || formData.description.length > 100) {
      newErrors.description = 'Descrição é obrigatória (máx 100 caracteres)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <h3>Pagamento</h3>
      
      <div className="form-group compact">
        <label>Cartão</label>
        <input
          className={`input-card-number ${errors.cardNumber ? 'error' : ''}`}
          type="text"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleChange}
          placeholder="4111 1111 1111 1111"
          maxLength="19"
        />
        {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
      </div>

      <div className="form-group compact">
        <label>Titular</label>
        <input
          className={`input-holder-name ${errors.cardName ? 'error' : ''}`}
          type="text"
          name="cardName"
          value={formData.cardName}
          onChange={handleChange}
          placeholder="João Silva"
          maxLength="50"
        />
        {errors.cardName && <span className="error-text">{errors.cardName}</span>}
      </div>

      <div className="form-row-3">
        <div className="form-group compact">
          <label>Validade</label>
          <input
            className={`input-expiration ${errors.expiry ? 'error' : ''}`}
            type="text"
            name="expiry"
            value={formData.expiry}
            onChange={handleChange}
            placeholder="12/25"
            maxLength="5"
          />
          {errors.expiry && <span className="error-text">{errors.expiry}</span>}
        </div>
        <div className="form-group compact">
          <label>CVV</label>
          <input
            className={`input-cvv ${errors.cvv ? 'error' : ''}`}
            type="text"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            maxLength="4"
          />
          {errors.cvv && <span className="error-text">{errors.cvv}</span>}
        </div>
        <div className="form-group compact">
          <label>Parcelas</label>
          <select
            className="select-installments"
            name="installments"
            value={formData.installments}
            onChange={handleChange}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}x</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group compact">
          <label>Valor (R$)</label>
          <input
            className={`input-amount ${errors.amount ? 'error' : ''}`}
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="100.00"
            step="0.01"
            min="0.01"
            max="10000"
          />
          {errors.amount && <span className="error-text">{errors.amount}</span>}
        </div>
        <div className="form-group compact">
          <label>Descrição</label>
          <input
            className={`input-description ${errors.description ? 'error' : ''}`}
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ex: Netflix"
            maxLength="100"
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>
      </div>

      <button type="submit" className="btn-pay" disabled={loading}>
        {loading ? '⏳ Processando' : '✓ Pagar'}
      </button>
    </form>
  )
}