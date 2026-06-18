import prisma from '../db.js'

const BRAND_BY_PREFIX = {
  4: ['visa', 0.025],
  5: ['mastercard', 0.03],
  3: ['amex', 0.035],
  6: ['elo', 0.04],
}

const DAILY_LIMIT_CENTS = 500000
const MIN_INSTALLMENT_CENTS = 1000

// Serializa as transacoes do mesmo cartao para que a checagem do limite diario
// e a gravacao aconteçam de forma atomica mesmo sob requisicoes concorrentes.
const cardLocks = new Map()
async function withCardLock(cardLast4, task) {
  const previous = cardLocks.get(cardLast4) ?? Promise.resolve()
  let release
  const current = new Promise((resolve) => { release = resolve })
  cardLocks.set(cardLast4, previous.then(() => current))
  await previous
  try {
    return await task()
  } finally {
    release()
    if (cardLocks.get(cardLast4) === current) cardLocks.delete(cardLast4)
  }
}

function toResponse(tx) {
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
    created_at: tx.createdAt,
  }
}

function isValidExpiration(expiration) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) return false
  const [month, year] = expiration.split('/').map(Number)
  const expiresAt = new Date(2000 + year, month, 1)
  return expiresAt > new Date()
}

function validateFields(body) {
  const {
    card_number: cardNumber,
    holder_name: holderName,
    expiration,
    cvv,
    amount_cents: amountCents,
    installments = 1,
    description,
  } = body ?? {}

  if (
    !Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1000000 ||
    !Number.isInteger(installments) || installments < 1 || installments > 12 ||
    !/^\d{16}$/.test(cardNumber ?? '') ||
    !/^\d{3,4}$/.test(cvv ?? '') ||
    typeof holderName !== 'string' || holderName.trim().length === 0 ||
    holderName.length > 50 || /[<>]/.test(holderName) ||
    typeof description !== 'string' || description.trim().length === 0 ||
    description.length > 100 ||
    !isValidExpiration(expiration ?? '')
  ) {
    return null
  }

  return { cardNumber, holderName: holderName.trim(), amountCents, installments, description: description.trim() }
}

function computeInterest(amountCents, installments) {
  if (installments === 1) {
    return { totalWithInterest: amountCents, installmentAmount: amountCents }
  }
  const rate = installments <= 6 ? 0.02 : 0.04
  const totalWithInterest = Math.ceil(amountCents * Math.pow(1 + rate, installments))
  const installmentAmount = Math.ceil(totalWithInterest / installments)
  return { totalWithInterest, installmentAmount }
}

export default async function (fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get('/balance', async () => {
    const [approvedAgg, totalApproved, totalDeclined, totalRefunded] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'approved' },
        _sum: { netAmount: true },
      }),
      prisma.transaction.count({ where: { status: 'approved' } }),
      prisma.transaction.count({ where: { status: 'declined' } }),
      prisma.transaction.count({ where: { status: 'refunded' } }),
    ])

    return {
      balance_cents: approvedAgg._sum.netAmount ?? 0,
      total_approved: totalApproved,
      total_declined: totalDeclined,
      total_refunded: totalRefunded,
    }
  })

  fastify.post('/transactions', async (req, reply) => {
    const idempotencyKey = req.body?.idempotency_key

    if (idempotencyKey) {
      const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } })
      if (existing) return reply.code(200).send(toResponse(existing))
    }

    const fields = validateFields(req.body)
    if (!fields) {
      return reply.code(422).send({ error: 'Dados invalidos' })
    }

    const { cardNumber, holderName, amountCents, installments, description } = fields
    const cardLast4 = cardNumber.slice(-4)
    const isForcedDecline = cardNumber.startsWith('9999')
    const brandConfig = BRAND_BY_PREFIX[cardNumber[0]]

    if (!isForcedDecline && !brandConfig) {
      return reply.code(422).send({ error: 'Bandeira desconhecida' })
    }

    const { totalWithInterest, installmentAmount } = computeInterest(amountCents, installments)
    if (installmentAmount < MIN_INSTALLMENT_CENTS) {
      return reply.code(422).send({ error: 'Parcela abaixo do minimo' })
    }

    const [cardBrand, feeRate] = brandConfig ?? ['desconhecida', 0]
    const feeCents = Math.round(amountCents * feeRate)
    const netAmount = amountCents - feeCents

    try {
      const transaction = await withCardLock(cardLast4, async () => {
        let status = isForcedDecline ? 'declined' : 'approved'

        if (status === 'approved') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const { _sum } = await prisma.transaction.aggregate({
            where: { cardLast4, status: 'approved', createdAt: { gte: today } },
            _sum: { amountCents: true },
          })
          if ((_sum.amountCents ?? 0) + amountCents > DAILY_LIMIT_CENTS) status = 'declined'
        }

        return prisma.transaction.create({
          data: {
            idempotencyKey: idempotencyKey ?? undefined,
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
          },
        })
      })

      return reply.code(201).send(toResponse(transaction))
    } catch (err) {
      if (err.code === 'P2002' && idempotencyKey) {
        const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } })
        if (existing) return reply.code(200).send(toResponse(existing))
      }
      throw err
    }
  })

  fastify.get('/transactions/:id', async (req, reply) => {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!transaction) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return toResponse(transaction)
  })

  fastify.get('/transactions', async (req) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100)
    const skip = (page - 1) * limit

    const [total, transactions] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    ])

    return {
      data: transactions.map(toResponse),
      pagination: { page, limit, total, total_pages: Math.max(Math.ceil(total / limit), 1) },
    }
  })

  fastify.post('/transactions/:id/refund', async (req, reply) => {
    const { id } = req.params

    const { count } = await prisma.transaction.updateMany({
      where: { id, status: 'approved' },
      data: { status: 'refunded' },
    })

    if (count === 1) {
      const transaction = await prisma.transaction.findUnique({ where: { id } })
      return toResponse(transaction)
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return reply.code(422).send({ error: 'Transacao nao pode ser estornada' })
  })
}
