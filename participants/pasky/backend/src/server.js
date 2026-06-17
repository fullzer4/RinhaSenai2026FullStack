import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, dbRun, dbGet, dbAll } from './database.js'

const app = express()

app.use(cors())
app.use(bodyParser.json())

// Aumentar limite de conexões
app.use((req, res, next) => {
  res.header('Connection', 'keep-alive')
  next()
})

// Inicializar banco de dados
await initDatabase()

function validateCardBrand(cardNumber) {
  const firstDigit = cardNumber[0]
  const brands = {
    '4': { name: 'visa', fee: 2.5 },
    '5': { name: 'mastercard', fee: 3.0 },
    '3': { name: 'amex', fee: 3.5 },
    '6': { name: 'elo', fee: 4.0 }
  }
  return brands[firstDigit] || null
}

function calculateInterest(amountCents, installments) {
  if (installments === 1) return amountCents
  let monthlyRate = installments <= 6 ? 0.02 : 0.04
  return Math.round(amountCents * Math.pow(1 + monthlyRate, installments))
}

function validateForm(data) {
  const errors = []
  if (!data.card_number || data.card_number.length !== 16) errors.push('card_number inválido')
  if (!data.holder_name || data.holder_name.length > 50) errors.push('holder_name inválido')
  if (!/^\d{2}\/\d{2}$/.test(data.expiration)) errors.push('expiration deve ser MM/YY')
  if (!data.cvv || data.cvv.length < 3 || data.cvv.length > 4) errors.push('cvv inválido')
  if (!data.amount_cents || data.amount_cents <= 0 || data.amount_cents > 1000000) errors.push('amount_cents inválido')
  if (!data.description || data.description.length > 100) errors.push('description obrigatória')
  return errors
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Criar Transação
app.post('/api/transactions', async (req, res) => {
  try {
    const { card_number, holder_name, expiration, cvv, amount_cents, installments = 1, description } = req.body

    // VALIDAÇÕES
    const errors = validateForm({ card_number, holder_name, expiration, cvv, amount_cents, description })
    if (errors.length > 0) return res.status(422).json({ message: errors[0] })

    const brand = validateCardBrand(card_number)
    if (!brand) return res.status(422).json({ message: 'Bandeira desconhecida' })

    // IDEMPOTÊNCIA: Verificar se já existe transação identica nos ultimos 2 minutos
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const existingTransaction = await dbGet(
      `SELECT * FROM transactions 
       WHERE card_number = ? 
       AND amount_cents = ? 
       AND description = ? 
       AND created_at > ?
       LIMIT 1`,
      [card_number, amount_cents, description, twoMinutesAgo]
    )

    if (existingTransaction) {
      return res.status(201).json({
        id: existingTransaction.id,
        status: existingTransaction.status,
        card_last4: existingTransaction.card_last4,
        amount_cents: existingTransaction.amount_cents,
        fee_cents: existingTransaction.fee_cents,
        net_amount: existingTransaction.net_amount
      })
    }

    // Cartão começa com 9999 = recusado
    if (card_number.startsWith('9999')) {
      const id = uuidv4()
      const now = new Date().toISOString()
      const fee = Math.round(amount_cents * (brand.fee / 100))
      const totalWithInterest = calculateInterest(amount_cents, installments)
      const installmentAmount = Math.ceil(totalWithInterest / installments)

      await dbRun(
        `INSERT INTO transactions (id, card_number, card_last4, card_brand, holder_name, expiration, cvv, amount_cents, fee_cents, net_amount, total_with_interest, installment_amount, installments, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, card_number, card_number.slice(-4), brand.name, holder_name, expiration, cvv, amount_cents, fee, amount_cents - fee, totalWithInterest, installmentAmount, installments, description, 'declined', now, now]
      )

      return res.status(201).json({ id, status: 'declined', message: 'Cartão recusado' })
    }

    const totalWithInterest = calculateInterest(amount_cents, installments)
    const installmentAmount = Math.ceil(totalWithInterest / installments)
    if (installmentAmount < 1000) return res.status(422).json({ message: 'Valor mínimo por parcela é R$ 10,00' })

    const cardLast4 = card_number.slice(-4)
    const today = new Date().toISOString().split('T')[0]
    
    const result = await dbGet(
      `SELECT SUM(amount_cents) as total FROM transactions WHERE card_last4 = ? AND status = 'approved' AND DATE(created_at) = ?`,
      [cardLast4, today]
    )

    const dailyTotal = (result?.total || 0) + amount_cents
    if (dailyTotal > 500000) return res.status(422).json({ message: 'Limite diário excedido' })

    const id = uuidv4()
    const now = new Date().toISOString()
    const fee = Math.round(amount_cents * (brand.fee / 100))
    const netAmount = amount_cents - fee

    await dbRun(
      `INSERT INTO transactions (id, card_number, card_last4, card_brand, holder_name, expiration, cvv, amount_cents, fee_cents, net_amount, total_with_interest, installment_amount, installments, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, card_number, cardLast4, brand.name, holder_name, expiration, cvv, amount_cents, fee, netAmount, totalWithInterest, installmentAmount, installments, description, 'approved', now, now]
    )

    res.status(201).json({ id, status: 'approved', card_last4: cardLast4, amount_cents, fee_cents: fee, net_amount: netAmount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao processar' })
  }
})

// Listar Transações com Paginação
app.get('/api/transactions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, parseInt(req.query.limit) || 10)
    const offset = (page - 1) * limit

    const transactions = await dbAll(
      `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const countResult = await dbGet('SELECT COUNT(*) as total FROM transactions')
    const total = countResult.total
    const totalPages = Math.ceil(total / limit)

    res.json({ data: transactions, pagination: { page, limit, total, total_pages: totalPages } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro' })
  }
})

// Obter Transação por ID
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [req.params.id])
    if (!transaction) return res.status(404).json({ message: 'Não encontrada' })
    res.json(transaction)
  } catch (error) {
    res.status(500).json({ message: 'Erro' })
  }
})

// Estornar Transação
app.post('/api/transactions/:id/refund', async (req, res) => {
  try {
    const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [req.params.id])
    if (!transaction) return res.status(404).json({ message: 'Não encontrada' })
    if (transaction.status !== 'approved') return res.status(422).json({ message: 'Não pode estornar' })

    const now = new Date().toISOString()
    await dbRun('UPDATE transactions SET status = ?, updated_at = ? WHERE id = ? AND status = ?', ['refunded', now, req.params.id, 'approved'])
    res.json({ status: 'refunded' })
  } catch (error) {
    res.status(500).json({ message: 'Erro' })
  }
})

// Saldo
app.get('/api/balance', async (req, res) => {
  try {
    const approved = await dbGet('SELECT COUNT(*) as count, SUM(net_amount) as total FROM transactions WHERE status = ?', ['approved'])
    const declined = await dbGet('SELECT COUNT(*) as count FROM transactions WHERE status = ?', ['declined'])
    const refunded = await dbGet('SELECT COUNT(*) as count FROM transactions WHERE status = ?', ['refunded'])

    res.json({
      balance_cents: approved.total || 0,
      total_approved: approved.count || 0,
      total_declined: declined.count || 0,
      total_refunded: refunded.count || 0
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro' })
  }
})

const PORT = 3000
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...')
  server.close(() => {
    console.log('Servidor encerrado')
    process.exit(0)
  })
})