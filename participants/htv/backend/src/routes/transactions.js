import prisma from '../db.js'

// ---------- FUNÇÕES AUXILIARES ----------

function detectBrand(cardNumber) {
  const first = cardNumber[0]
  const brands = {
    '4': { name: 'visa', fee: 0.025 },
    '5': { name: 'mastercard', fee: 0.03 },
    '3': { name: 'amex', fee: 0.035 },
    '6': { name: 'elo', fee: 0.04 },
  }
  return brands[first] || null
}

function isExpired(expiration) {
  const [month, year] = expiration.split('/').map(Number)
  const now = new Date()
  const expFullYear = 2000 + year
  return (
    expFullYear < now.getFullYear() ||
    (expFullYear === now.getFullYear() && month <= now.getMonth())
  )
}

function calcInterest(amountCents, installments) {
  if (installments === 1) return { total: amountCents, installmentAmount: amountCents }
  const rate = installments <= 6 ? 0.02 : 0.04
  const total = Math.ceil(amountCents * Math.pow(1 + rate, installments))
  const installmentAmount = Math.ceil(total / installments)
  return { total, installmentAmount }
}

// ---------- ROTAS ----------

export default async function (fastify) {

  // GET /api/health
  fastify.get('/health', async () => ({ status: 'ok' }))

  // ---------------------------------------------------------
  // POST /api/transactions - CRIAR TRANSAÇÃO
  // ---------------------------------------------------------
  fastify.post('/transactions', async (req, reply) => {
    const {
      card_number, holder_name, expiration, cvv,
      amount_cents, installments = 1, description, idempotency_key
    } = req.body

    // --- VALIDAÇÕES DE CAMPOS ---
    if (!card_number || !/^\d{16}$/.test(card_number)) {
      return reply.code(422).send({ error: 'card_number deve ter 16 dígitos numéricos' })
    }
    if (!holder_name || holder_name.length > 50 || /<[^>]*>/.test(holder_name)) {
      return reply.code(422).send({ error: 'holder_name inválido' })
    }
    if (!expiration || !/^\d{2}\/\d{2}$/.test(expiration) || isExpired(expiration)) {
      return reply.code(422).send({ error: 'expiration inválido ou vencido' })
    }
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      return reply.code(422).send({ error: 'cvv deve ter 3 ou 4 dígitos' })
    }
    if (!amount_cents || amount_cents <= 0 || amount_cents > 1000000) {
      return reply.code(422).send({ error: 'amount_cents inválido' })
    }
    if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
      return reply.code(422).send({ error: 'installments deve ser 1-12' })
    }
    if (!description || description.length > 100) {
      return reply.code(422).send({ error: 'description inválida' })
    }

    const cardLast4 = card_number.slice(-4)

    // --- CARTÃO 9999 = DECLINED (ANTES da validação de bandeira) ---
    const isDeclinedCard = card_number.startsWith('9999')
    let status = isDeclinedCard ? 'declined' : 'approved'

    // --- BANDEIRA ---
    let brand = detectBrand(card_number)
    if (!brand) {
      // Cartão 9999 tem bandeira desconhecida mas é aceito como declined
      if (isDeclinedCard) {
        // Usa marca "unknown" para salvar no banco
        brand = { name: 'unknown', fee: 0 }
      } else {
        return reply.code(422).send({ error: 'Bandeira desconhecida' })
      }
    }

    // --- IDEMPOTÊNCIA ---
    if (idempotency_key) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey: idempotency_key }
      })
      if (existing) {
        return reply.code(200).send(formatTransaction(existing))
      }
    }

    // --- JUROS ---
    const { total: totalWithInterest, installmentAmount } = calcInterest(amount_cents, installments)

    // --- PARCELA MÍNIMA R$10 ---
    if (installmentAmount < 1000) {
      return reply.code(422).send({ error: 'Valor mínimo por parcela é R$10,00' })
    }

    // --- TAXA E LÍQUIDO ---
    const feeCents = Math.round(amount_cents * brand.fee)
    const netAmount = amount_cents - feeCents

    try {
      // --- CRIAÇÃO ATÔMICA (com checagem do limite diário) ---
      const transaction = await prisma.$transaction(async (tx) => {
        // Verifica limite diário se for approved
        if (status === 'approved') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const dailySum = await tx.transaction.aggregate({
            where: {
              cardLast4,
              status: 'approved',
              createdAt: { gte: today }
            },
            _sum: { amountCents: true }
          })

          const currentDaily = dailySum._sum.amountCents || 0
          if (currentDaily + amount_cents > 500000) {
            status = 'declined'
          }
        }

        // Cria a transação
        return tx.transaction.create({
          data: {
            status,
            cardLast4,
            cardBrand: brand.name,
            holderName: holder_name,
            amountCents: amount_cents,
            installments,
            installmentAmount,
            totalWithInterest,
            feeCents,
            netAmount,
            description,
            idempotencyKey: idempotency_key || null,
          }
        })
      })

      return reply.code(201).send(formatTransaction(transaction))

    } catch (err) {
      // Se der erro de unique constraint na idempotency_key, busca a existente
      if (err.code === 'P2002' && idempotency_key) {
        const existing = await prisma.transaction.findUnique({
          where: { idempotencyKey: idempotency_key }
        })
        if (existing) {
          return reply.code(200).send(formatTransaction(existing))
        }
      }
      throw err
    }
  })

  // ---------------------------------------------------------
  // GET /api/transactions/:id - CONSULTAR UMA TRANSAÇÃO
  // ---------------------------------------------------------
  fastify.get('/transactions/:id', async (req, reply) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    })
    if (!transaction) {
      return reply.code(404).send({ error: 'Transação não encontrada' })
    }
    return formatTransaction(transaction)
  })

  // ---------------------------------------------------------
  // GET /api/transactions - LISTAR TRANSAÇÕES (PAGINADO)
  // ---------------------------------------------------------
  fastify.get('/transactions', async (req, reply) => {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count()
    ])

    return {
      data: data.map(formatTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    }
  })

  // ---------------------------------------------------------
  // POST /api/transactions/:id/refund - ESTORNO
  // ---------------------------------------------------------
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    // updateMany com WHERE status='approved' previne double refund
    const result = await prisma.transaction.updateMany({
      where: { id: req.params.id, status: 'approved' },
      data: { status: 'refunded' }
    })

    if (result.count === 0) {
      return reply.code(422).send({ error: 'Transação não pode ser estornada' })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    })
    return formatTransaction(transaction)
  })

  // ---------------------------------------------------------
  // GET /api/balance - SALDO
  // ---------------------------------------------------------
  fastify.get('/balance', async (req, reply) => {
    const [approved, declinedCount, refundedCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'approved' },
        _sum: { netAmount: true },
        _count: true
      }),
      prisma.transaction.count({ where: { status: 'declined' } }),
      prisma.transaction.count({ where: { status: 'refunded' } })
    ])

    return {
      balance_cents: approved._sum.netAmount || 0,
      total_approved: approved._count,
      total_declined: declinedCount,
      total_refunded: refundedCount
    }
  })
}

// ---------- FORMATAR RESPOSTA ----------

function formatTransaction(t) {
  return {
    id: t.id,
    status: t.status,
    card_last4: t.cardLast4,
    card_brand: t.cardBrand,
    holder_name: t.holderName,
    amount_cents: t.amountCents,
    installments: t.installments,
    installment_amount: t.installmentAmount,
    total_with_interest: t.totalWithInterest,
    fee_cents: t.feeCents,
    net_amount: t.netAmount,
    description: t.description,
    created_at: t.createdAt.toISOString()
  }
}
