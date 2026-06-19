import crypto from 'node:crypto'
import db from '../db.js'

const DAILY_LIMIT_CENTS = 500000

const TRANSACTION_FIELDS = `
  id,
  idempotency_key AS idempotencyKey,
  status,
  card_last4 AS cardLast4,
  card_brand AS cardBrand,
  holder_name AS holderName,
  amount_cents AS amountCents,
  installments,
  installment_amount AS installmentAmount,
  total_with_interest AS totalWithInterest,
  fee_cents AS feeCents,
  net_amount AS netAmount,
  description,
  created_at AS createdAt
`

const statements = {
  findById: db.prepare(`SELECT ${TRANSACTION_FIELDS} FROM transactions WHERE id = ?`),
  findByIdempotencyKey: db.prepare(`SELECT ${TRANSACTION_FIELDS} FROM transactions WHERE idempotency_key = ?`),
  dailyTotal: db.prepare(`
    SELECT COALESCE(SUM(total_with_interest), 0) AS total
    FROM transactions
    WHERE card_last4 = ? AND status = 'approved' AND created_at >= ?
  `),
  insert: db.prepare(`
    INSERT INTO transactions (
      id,
      idempotency_key,
      status,
      card_last4,
      card_brand,
      holder_name,
      amount_cents,
      installments,
      installment_amount,
      total_with_interest,
      fee_cents,
      net_amount,
      description,
      created_at
    ) VALUES (
      @id,
      @idempotencyKey,
      @status,
      @cardLast4,
      @cardBrand,
      @holderName,
      @amountCents,
      @installments,
      @installmentAmount,
      @totalWithInterest,
      @feeCents,
      @netAmount,
      @description,
      @createdAt
    )
  `),
  balance: db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'approved' THEN net_amount ELSE 0 END), 0) AS balance_cents,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) AS total_approved,
      COALESCE(SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END), 0) AS total_declined,
      COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) AS total_refunded
    FROM transactions
  `),
  list: db.prepare(`
    SELECT ${TRANSACTION_FIELDS}
    FROM transactions
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `),
  count: db.prepare('SELECT COUNT(*) AS total FROM transactions'),
  refund: db.prepare("UPDATE transactions SET status = 'refunded' WHERE id = ? AND status = 'approved'")
}

const createTransaction = db.transaction((data) => {
  const existing = statements.findByIdempotencyKey.get(data.idempotencyKey)
  if (existing) return { created: false, tx: existing }

  let status = data.status
  if (status === 'approved') {
    const daily = statements.dailyTotal.get(data.cardLast4, startOfTodayIso())
    if ((daily?.total || 0) + data.totalWithInterest > DAILY_LIMIT_CENTS) {
      status = 'declined'
    }
  }

  const approved = status === 'approved'
  const tx = {
    id: crypto.randomUUID(),
    idempotencyKey: data.idempotencyKey,
    status,
    cardLast4: data.cardLast4,
    cardBrand: data.cardBrand,
    holderName: data.holderName,
    amountCents: data.amountCents,
    installments: data.installments,
    installmentAmount: data.installmentAmount,
    totalWithInterest: data.totalWithInterest,
    feeCents: approved ? data.feeCents : 0,
    netAmount: approved ? data.netAmount : 0,
    description: data.description,
    createdAt: new Date().toISOString()
  }

  statements.insert.run(tx)
  return { created: true, tx }
})

const refundTransaction = db.transaction((id) => {
  const result = statements.refund.run(id)
  if (result.changes !== 1) return null
  return statements.findById.get(id)
})

function formatTransaction(tx) {
  return {
    id: tx.id,
    status: tx.status,
    card_last4: tx.cardLast4,
    card_brand: tx.cardBrand,
    holder_name: tx.holderName,
    amount_cents: tx.amountCents,
    installments: tx.installments,
    installment_amount: tx.installmentAmount,
    total_with_interest: tx.totalWithInterest,
    fee_cents: tx.feeCents,
    net_amount: tx.netAmount,
    description: tx.description,
    created_at: toIsoString(tx.createdAt)
  }
}

function toIsoString(value) {
  if (value instanceof Date) return value.toISOString()

  const text = String(value || '')
  if (text.includes('T')) return text

  const date = new Date(`${text.replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? text : date.toISOString()
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasHtmlTags(value) {
  return /<[^>]*>/g.test(value)
}

function validateExpiration(expiration) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration || '')) return false

  const [monthStr, yearStr] = expiration.split('/')
  const month = Number(monthStr)
  const year = 2000 + Number(yearStr)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return year > currentYear || (year === currentYear && month >= currentMonth)
}

function validateBody(body) {
  const errors = []
  const installments = body.installments ?? 1
  const holderName = cleanString(body.holder_name)
  const description = cleanString(body.description)

  if (!Number.isInteger(body.amount_cents) || body.amount_cents <= 0 || body.amount_cents > 1000000) {
    errors.push('amount_cents invalido')
  }

  if (!/^\d{16}$/.test(body.card_number || '')) {
    errors.push('card_number invalido')
  }

  if (!/^\d{3,4}$/.test(body.cvv || '')) {
    errors.push('cvv invalido')
  }

  if (!holderName || holderName.length > 50 || hasHtmlTags(holderName)) {
    errors.push('holder_name invalido')
  }

  if (!validateExpiration(body.expiration)) {
    errors.push('expiration invalido')
  }

  if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
    errors.push('installments invalido')
  }

  if (!description || description.length > 100) {
    errors.push('description invalida')
  }

  return errors
}

function getCardBrand(cardNumber) {
  const first = cardNumber[0]
  if (first === '4') return { brand: 'visa', feeRate: 0.025 }
  if (first === '5') return { brand: 'mastercard', feeRate: 0.03 }
  if (first === '3') return { brand: 'amex', feeRate: 0.035 }
  if (first === '6') return { brand: 'elo', feeRate: 0.04 }
  return null
}

function calculateAmounts(amountCents, installments, feeRate) {
  let interestRate = 0
  if (installments >= 2 && installments <= 6) interestRate = 0.02
  if (installments >= 7 && installments <= 12) interestRate = 0.04

  const totalWithInterest = Math.ceil(amountCents * Math.pow(1 + interestRate, installments))
  const installmentAmount = Math.ceil(totalWithInterest / installments)
  const feeCents = Math.round(amountCents * feeRate)
  const netAmount = amountCents - feeCents

  return { totalWithInterest, installmentAmount, feeCents, netAmount }
}

function createIdempotencyKey(body) {
  if (typeof body.idempotency_key === 'string' && body.idempotency_key.trim()) {
    return body.idempotency_key.trim()
  }

  const payload = {
    card_number: body.card_number,
    holder_name: cleanString(body.holder_name),
    expiration: body.expiration,
    cvv: body.cvv,
    amount_cents: body.amount_cents,
    installments: body.installments ?? 1,
    description: cleanString(body.description)
  }

  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function startOfTodayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function parsePage(query) {
  return Math.max(parseInt(query.page || '1', 10) || 1, 1)
}

function parseLimit(query) {
  return Math.min(Math.max(parseInt(query.limit || '10', 10) || 10, 1), 100)
}

export default async function (fastify) {
  fastify.get('/health', () => ({ status: 'ok' }))

  fastify.get('/balance', () => statements.balance.get())

  fastify.post('/transactions', (req, reply) => {
    const body = req.body || {}
    const errors = validateBody(body)
    if (errors.length) return reply.code(422).send({ errors })

    const cardNumber = body.card_number
    const cardLast4 = cardNumber.slice(-4)
    const installments = body.installments ?? 1
    const idempotencyKey = createIdempotencyKey(body)
    const holderName = cleanString(body.holder_name)
    const description = cleanString(body.description)
    let status = 'approved'
    let cardBrand = 'unknown'
    let feeRate = 0

    if (cardNumber.startsWith('9999')) {
      status = 'declined'
    } else {
      const brandInfo = getCardBrand(cardNumber)
      if (!brandInfo) return reply.code(422).send({ error: 'Bandeira desconhecida' })
      cardBrand = brandInfo.brand
      feeRate = brandInfo.feeRate
    }

    const amounts = calculateAmounts(body.amount_cents, installments, feeRate)
    if (amounts.totalWithInterest / installments < 1000) {
      return reply.code(422).send({ error: 'Valor minimo por parcela e R$10,00' })
    }

    try {
      const result = createTransaction({
        idempotencyKey,
        status,
        cardLast4,
        cardBrand,
        holderName,
        amountCents: body.amount_cents,
        installments,
        installmentAmount: amounts.installmentAmount,
        totalWithInterest: amounts.totalWithInterest,
        feeCents: amounts.feeCents,
        netAmount: amounts.netAmount,
        description
      })

      return reply.code(result.created ? 201 : 200).send(formatTransaction(result.tx))
    } catch (error) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const tx = statements.findByIdempotencyKey.get(idempotencyKey)
        if (tx) return reply.code(200).send(formatTransaction(tx))
      }

      throw error
    }
  })

  fastify.get('/transactions', (req) => {
    const page = parsePage(req.query)
    const limit = parseLimit(req.query)
    const skip = (page - 1) * limit
    const items = statements.list.all(limit, skip)
    const total = statements.count.get().total

    return {
      data: items.map(formatTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    }
  })

  fastify.get('/transactions/:id', (req, reply) => {
    const tx = statements.findById.get(req.params.id)
    if (!tx) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return formatTransaction(tx)
  })

  fastify.post('/transactions/:id/refund', (req, reply) => {
    const tx = refundTransaction(req.params.id)
    if (!tx) return reply.code(422).send({ error: 'Transacao nao pode ser estornada' })
    return formatTransaction(tx)
  })
}
