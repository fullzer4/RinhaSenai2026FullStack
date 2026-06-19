import prisma from '../db.js'

const BRAND_BY_PREFIX = {
  3: ['amex', 0.035],
  4: ['visa', 0.025],
  5: ['mastercard', 0.03],
  6: ['elo', 0.04],
}

// Implementacao adicionada: helpers e cache simples para criar transacoes.
const idempotency = new Map()
const cardLocks = new Map()

// Converte os nomes internos do Prisma para o formato esperado pela API.
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

// Valida se a validade do cartao esta no formato MM/YY e ainda nao venceu.
function isValidExpiration(expiration) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) return false
  const [month, year] = expiration.split('/').map(Number)
  const expiresAt = new Date(2000 + year, month, 1)
  return expiresAt > new Date()
}

// Serializa transacoes do mesmo cartao para evitar estouro de limite diario por concorrencia.
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

export default async function (fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get('/balance', async (req, reply) => {
    const { _sum } = await prisma.transaction.aggregate({
      where: { status: 'approved' },
      _sum: {
        totalWithInterest: true,
        feeCents: true,
        netAmount: true,
      },
    })

    return {
      grossCents: _sum.totalWithInterest ?? 0,
      feeCents: _sum.feeCents ?? 0,
      netCents: _sum.netAmount ?? 0,
    }
  })

  fastify.post('/transactions', async (req, reply) => {
    // Implementacao adicionada: validacao, calculos, limite diario e gravacao da transacao.

    // Reaproveita a transacao ja criada quando a mesma idempotency_key chega de novo.
    const key = req.body?.idempotency_key
    if (key && idempotency.has(key)) {
      return reply.code(200).send(toResponse(await idempotency.get(key)))
    }

    const create = (async () => {
      // Le os campos enviados no corpo da requisicao.
      const {
        card_number: cardNumber,
        holder_name: holderName,
        expiration,
        cvv,
        amount_cents: amountCents,
        installments = 1,
        description,
      } = req.body ?? {}

      // Valida os campos obrigatorios e regras basicas antes de criar no banco.
      if (
        !Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1000000 ||
        !Number.isInteger(installments) || installments < 1 || installments > 12 ||
        !/^\d{16}$/.test(cardNumber ?? '') ||
        !/^\d{3,4}$/.test(cvv ?? '') ||
        typeof holderName !== 'string' || holderName.trim().length === 0 ||
        holderName.length > 50 || /[<>]/.test(holderName) ||
        typeof description !== 'string' || description.trim().length === 0 ||
        description.length > 100 || !isValidExpiration(expiration ?? '')
      ) {
        const error = new Error('Dados invalidos')
        error.statusCode = 422
        throw error
      }

      // Descobre bandeira, ultimos 4 digitos e caso especial de cartao recusado.
      const cardLast4 = cardNumber.slice(-4)
      const prefix = cardNumber[0]
      const brandConfig = BRAND_BY_PREFIX[prefix]
      const isForcedDecline = cardNumber.startsWith('9999')
      if (!brandConfig && !isForcedDecline) {
        const error = new Error('Bandeira desconhecida')
        error.statusCode = 422
        throw error
      }

      // Calcula juros compostos, valor de parcela, taxa da bandeira e valor liquido.
      const [cardBrand, feeRate] = brandConfig ?? ['unknown', 0]
      const interestRate = installments === 1 ? 0 : installments <= 6 ? 0.02 : 0.04
      const totalWithInterest = installments === 1
        ? amountCents
        : Math.ceil(amountCents * Math.pow(1 + interestRate, installments))
      const installmentAmount = Math.ceil(totalWithInterest / installments)
      if (totalWithInterest / installments < 1000) {
        const error = new Error('Parcela abaixo do minimo')
        error.statusCode = 422
        throw error
      }

      const feeCents = Math.round(amountCents * feeRate)
      const netAmount = amountCents - feeCents

      // Confere limite diario e salva a transacao com status approved ou declined.
      return withCardLock(cardLast4, async () => {
        let status = isForcedDecline ? 'declined' : 'approved'
        if (status === 'approved') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const { _sum } = await prisma.transaction.aggregate({
            where: { cardLast4, status: 'approved', createdAt: { gte: today } },
            _sum: { amountCents: true },
          })
          if (((_sum.amountCents ?? 0) + amountCents) > 500000) status = 'declined'
        }

        return prisma.transaction.create({
          data: {
            status,
            cardLast4,
            cardBrand,
            holderName: holderName.trim(),
            amountCents,
            installments,
            installmentAmount,
            totalWithInterest,
            feeCents,
            netAmount,
            description: description.trim(),
          },
        })
      })
    })()

    // Guarda a promessa em andamento para responder chamadas repetidas sem duplicar transacao.
    if (key) idempotency.set(key, create)

    // Retorna 201 quando criou, ou erro 422/500 quando alguma regra falhou.
    try {
      const transaction = await create
      return reply.code(201).send(toResponse(transaction))
    } catch (error) {
      if (key) idempotency.delete(key)
      return reply.code(error.statusCode ?? 500).send({ error: error.message })
    }
  })

  fastify.get('/transactions/:id', async (req, reply) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    })

    if (!transaction) {
      return reply.code(404).send({ error: 'Transacao nao encontrada' })
    }

    return toResponse(transaction)
  })

  fastify.get('/transactions', async (req, reply) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100)
    const skip = (page - 1) * limit

    const [total, transactions] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      data: transactions.map(toResponse),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!transaction) {
      return reply.code(404).send({ error: 'Transacao nao encontrada' })
    }

    return reply.code(422).send({ error: 'Transacao nao pode ser estornada' })
  })
}
