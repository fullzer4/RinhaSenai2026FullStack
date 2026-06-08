import prisma from '../db.js'

export default async function (fastify) {

  // GET /api/health
  fastify.get('/health', async () => ({ status: 'ok' }))

  // GET /api/balance
  fastify.get('/balance', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  // POST /api/transactions
  fastify.post('/transactions', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  // GET /api/transactions/:id
  fastify.get('/transactions/:id', async (req, reply) => {
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    })
    if (!tx) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return formatTransaction(tx)
  })

  // GET /api/transactions?page=1&limit=10
  fastify.get('/transactions', async (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count(),
    ])

    return {
      data: data.map(formatTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  })

  // POST /api/transactions/:id/refund
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })
}

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
    created_at: tx.createdAt.toISOString(),
  }
}
