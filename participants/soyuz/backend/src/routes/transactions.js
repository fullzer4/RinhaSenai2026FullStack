import { randomUUID } from 'node:crypto'
import prisma, { libsql } from '../db.js'

const BRAND_RULES = {
  3: { brand: 'amex', fee: 0.035 },
  4: { brand: 'visa', fee: 0.025 },
  5: { brand: 'mastercard', fee: 0.03 },
  6: { brand: 'elo', fee: 0.04 },
}

const DAILY_LIMIT_CENTS = 500000

function errBody(message) {
  return { error: message }
}

function rowToApi(row) {
  return {
    id: row.id,
    status: row.status,
    card_last4: row.card_last4,
    card_brand: row.card_brand,
    holder_name: row.holder_name,
    amount_cents: Number(row.amount_cents),
    installments: Number(row.installments),
    installment_amount: Number(row.installment_amount),
    total_with_interest: Number(row.total_with_interest),
    fee_cents: Number(row.fee_cents),
    net_amount: Number(row.net_amount),
    description: row.description,
    expiration: row.expiration,
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString(),
    refunded_at: row.refundedAt
      ? (row.refundedAt instanceof Date ? row.refundedAt.toISOString() : new Date(row.refundedAt).toISOString())
      : null,
  }
}

function prismaToApi(tx) {
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
    expiration: tx.expiration,
    created_at: tx.createdAt.toISOString(),
    refunded_at: tx.refundedAt?.toISOString() ?? null,
  }
}

function detectBrand(cardNumber) {
  return BRAND_RULES[cardNumber[0]] ?? null
}

function interestRate(installments) {
  if (installments === 1) return 0
  if (installments <= 6) return 0.02
  return 0.04
}

function calculate(amountCents, installments, brandFee) {
  const rate = interestRate(installments)
  const totalWithInterest = installments === 1
    ? amountCents
    : Math.ceil(amountCents * Math.pow(1 + rate, installments))
  const installmentAmount = Math.ceil(totalWithInterest / installments)
  const feeCents = Math.round(amountCents * brandFee)
  const netAmount = amountCents - feeCents
  return { totalWithInterest, installmentAmount, feeCents, netAmount }
}

function hasHtml(value) {
  return /<[^>]*>/.test(value)
}

function expirationIsValid(expiration) {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiration)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  return year > currentYear || (year === currentYear && month >= currentMonth)
}

function validateBody(body) {
  const {
    card_number,
    holder_name,
    expiration,
    cvv,
    amount_cents,
    installments = 1,
    description,
  } = body ?? {}

  if (!Number.isInteger(amount_cents) || amount_cents <= 0 || amount_cents > 1000000)
    return 'amount_cents invalido'
  if (!/^\d{16}$/.test(String(card_number ?? '')))
    return 'card_number invalido'
  if (!/^\d{3,4}$/.test(String(cvv ?? '')))
    return 'cvv invalido'
  if (typeof holder_name !== 'string' || holder_name.trim() === '' || holder_name.length > 50 || hasHtml(holder_name))
    return 'holder_name invalido'
  if (typeof expiration !== 'string' || !expirationIsValid(expiration))
    return 'expiration invalida'
  if (!Number.isInteger(installments) || installments < 1 || installments > 12)
    return 'installments invalido'
  if (typeof description !== 'string' || description.trim() === '' || description.length > 100)
    return 'description invalida'

  return null
}

function buildIdempotencyKey(body) {
  if (typeof body.idempotency_key === 'string' && body.idempotency_key.trim() !== '') {
    return body.idempotency_key.trim()
  }
  return JSON.stringify({
    card_number: body.card_number,
    holder_name: body.holder_name,
    expiration: body.expiration,
    amount_cents: body.amount_cents,
    installments: body.installments ?? 1,
    description: body.description,
  })
}

async function withBusyRetry(operation, attempts = 8) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err
      const message = `${err?.message ?? ''} ${err?.code ?? ''}`.toLowerCase()
      if (!message.includes('busy') && !message.includes('locked') && !message.includes('sqlite_busy')) throw err
      await new Promise((resolve) => setTimeout(resolve, 20 + 30 * attempt))
    }
  }
  throw lastError
}

/**
 * Atomically check daily limit and insert transaction using a libsql transaction.
 * Returns { created: true, tx: row } or { created: false, existing: row } for idempotency,
 * or throws with a .statusCode and .message for business rule violations.
 */
async function atomicCreateTransaction(data) {
  const {
    id,
    idempotencyKey,
    status,
    cardLast4,
    cardBrand,
    holderName,
    amountCents,
    installments,
    installmentAmount,
    totalWithInterest,
    feeCents,
    netAmount,
    description,
    expiration,
    declinedByCard,
  } = data

  return withBusyRetry(async () => {
    const txn = await libsql.transaction('write')
    try {
      // 1. Check idempotency inside transaction
      const existingRows = await txn.execute({
        sql: 'SELECT * FROM transactions WHERE idempotencyKey = ? LIMIT 1',
        args: [idempotencyKey],
      })
      if (existingRows.rows.length > 0) {
        await txn.commit()
        return { created: false, row: existingRows.rows[0] }
      }

      // 2. Check daily limit (only for non-9999 cards)
      let finalStatus = status
      if (!declinedByCard) {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

        const limitRow = await txn.execute({
          sql: `SELECT COALESCE(SUM(amount_cents), 0) as total FROM transactions
                WHERE card_last4 = ? AND status = 'approved'
                AND created_at >= ? AND created_at < ?`,
          args: [cardLast4, startOfDay, endOfDay],
        })
        const usedToday = Number(limitRow.rows[0].total ?? 0)
        if (usedToday + amountCents > DAILY_LIMIT_CENTS) {
          finalStatus = 'declined'
        }
      }

      const finalNetAmount = finalStatus === 'approved' ? netAmount : 0

      // 3. Insert
      await txn.execute({
        sql: `INSERT INTO transactions
          (id, status, card_last4, card_brand, holder_name, amount_cents, installments,
           installment_amount, total_with_interest, fee_cents, net_amount,
           description, expiration, idempotencyKey, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id, finalStatus, cardLast4, cardBrand, holderName, amountCents, installments,
          installmentAmount, totalWithInterest, feeCents, finalNetAmount,
          description, expiration, idempotencyKey,
        ],
      })

      await txn.commit()

      const newRow = await libsql.execute({
        sql: 'SELECT * FROM transactions WHERE id = ? LIMIT 1',
        args: [id],
      })
      return { created: true, row: newRow.rows[0] }
    } catch (err) {
      await txn.rollback()
      throw err
    }
  })
}

export default async function (fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get('/balance', async (_req, reply) => {
    const [approved, declined, refunded, balanceResult] = await Promise.all([
      prisma.transaction.count({ where: { status: 'approved' } }),
      prisma.transaction.count({ where: { status: 'declined' } }),
      prisma.transaction.count({ where: { status: 'refunded' } }),
      prisma.transaction.aggregate({
        _sum: { netAmount: true },
        where: { status: 'approved' },
      }),
    ])

    reply.send({
      balance_cents: balanceResult._sum.netAmount ?? 0,
      total_approved: approved,
      total_declined: declined,
      total_refunded: refunded,
    })
  })

  fastify.post('/transactions', async (req, reply) => {
    const body = req.body ?? {}
    const validationError = validateBody(body)
    if (validationError) return reply.code(422).send(errBody(validationError))

    const declinedByCard = String(body.card_number).startsWith('9999')
    const rule = detectBrand(body.card_number)

    if (!rule && !declinedByCard) {
      return reply.code(422).send(errBody('bandeira invalida'))
    }

    const cardLast4 = body.card_number.slice(-4)
    const brand = rule?.brand ?? 'unknown'
    const fee = rule?.fee ?? 0
    const installments = body.installments ?? 1
    const amounts = calculate(body.amount_cents, installments, fee)

    // Minimum installment check: R$10.00 = 1000 cents
    if (amounts.installmentAmount < 1000) {
      return reply.code(422).send(errBody('valor minimo da parcela invalido'))
    }

    const idempotencyKey = buildIdempotencyKey(body)
    const id = randomUUID()

    try {
      const result = await atomicCreateTransaction({
        id,
        idempotencyKey,
        status: declinedByCard ? 'declined' : 'approved',
        cardLast4,
        cardBrand: brand,
        holderName: body.holder_name.trim(),
        amountCents: body.amount_cents,
        installments,
        installmentAmount: amounts.installmentAmount,
        totalWithInterest: amounts.totalWithInterest,
        feeCents: amounts.feeCents,
        netAmount: amounts.netAmount,
        description: body.description.trim(),
        expiration: body.expiration,
        declinedByCard,
      })

      const apiData = rowToApi(result.row)
      return reply.code(result.created ? 201 : 200).send(apiData)
    } catch (err) {
      // If unique constraint violation (concurrent idempotency), fetch existing
      const msg = `${err?.message ?? ''} ${err?.code ?? ''}`.toLowerCase()
      if (msg.includes('unique') || err?.code === 'P2002') {
        const existing = await withBusyRetry(() =>
          prisma.transaction.findUnique({ where: { idempotencyKey } })
        )
        if (existing) return reply.code(200).send(prismaToApi(existing))
      }
      throw err
    }
  })

  fastify.get('/transactions/:id', async (req, reply) => {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!tx) return reply.code(404).send(errBody('transacao nao encontrada'))
    reply.send(prismaToApi(tx))
  })

  fastify.get('/transactions', async (req, reply) => {
    const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit ?? '10', 10) || 10))
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    reply.send({
      data: data.map(prismaToApi),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    })
  })

  fastify.post('/transactions/:id/refund', async (req, reply) => {
    const { id } = req.params

    const result = await withBusyRetry(() =>
      prisma.transaction.updateMany({
        where: { id, status: 'approved' },
        data: { status: 'refunded', refundedAt: new Date(), netAmount: 0 },
      })
    )

    if (result.count === 0) return reply.code(422).send(errBody('estorno invalido'))

    const tx = await prisma.transaction.findUnique({ where: { id } })
    reply.send(prismaToApi(tx))
  })
}
