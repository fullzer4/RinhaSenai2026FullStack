import { v4 as uuidv4 } from 'uuid'
import prisma from '../db.js'

const BRANDS = {
  '3': { name: 'amex', fee: 0.035 },
  '4': { name: 'visa', fee: 0.025 },
  '5': { name: 'mastercard', fee: 0.03 },
  '6': { name: 'elo', fee: 0.04 },
}

function getBrand(cardNumber) {
  return BRANDS[cardNumber[0]] || null
}

function calculateInterest(amountCents, installments) {
  if (installments === 1) return amountCents
  const rate = installments <= 6 ? 0.02 : 0.04
  return Math.ceil(amountCents * Math.pow(1 + rate, installments))
}

const DAILY_LIMIT_CENTS = 500000
const MIN_INSTALLMENT_CENTS = 1000
const MAX_RETRIES = 5

async function withRetry(fn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isRetryable = err.code === 'P2034' || err.message?.includes('SQLITE_BUSY')
      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err
      await new Promise(r => setTimeout(r, 50 * Math.pow(2, attempt) + Math.random() * 50))
    }
  }
}

export default async function (fastify) {

  // POST /api/transactions -- criar transacao
  fastify.post('/transactions', async (req, reply) => {
    const {
      card_number,
      holder_name,
      expiration,
      cvv,
      amount_cents,
      installments,
      description,
      idempotency_key,
    } = req.body || {}

    // Validar campos obrigatorios
    if (
      !card_number || !holder_name || !expiration || !cvv ||
      amount_cents == null || !description || !idempotency_key
    ) {
      return reply.code(422).send({ error: 'Campos obrigatorios faltando' })
    }

    // Validar card_number: exatamente 16 digitos numericos
    if (!/^\d{16}$/.test(card_number)) {
      return reply.code(422).send({ error: 'card_number deve ter 16 digitos numericos' })
    }

    // Validar cvv: 3 ou 4 digitos numericos
    if (!/^\d{3,4}$/.test(cvv)) {
      return reply.code(422).send({ error: 'cvv deve ter 3 ou 4 digitos' })
    }

    // Validar amount_cents: > 0 e <= 1000000
    if (!Number.isInteger(amount_cents) || amount_cents <= 0 || amount_cents > 1000000) {
      return reply.code(422).send({ error: 'amount_cents deve ser entre 1 e 1000000' })
    }

    // Validar holder_name: nao vazio, max 50, sem tags HTML
    if (typeof holder_name !== 'string' || holder_name.trim().length === 0 || holder_name.length > 50 || /<[^>]*>/.test(holder_name)) {
      return reply.code(422).send({ error: 'holder_name invalido' })
    }

    // Validar expiration: MM/YY, nao vencido
    if (!/^\d{2}\/\d{2}$/.test(expiration)) {
      return reply.code(422).send({ error: 'expiration deve ser MM/YY' })
    }
    const [expMonth, expYear] = expiration.split('/').map(Number)
    if (expMonth < 1 || expMonth > 12) {
      return reply.code(422).send({ error: 'Mes de expiracao invalido' })
    }
    const now = new Date()
    const expDate = new Date(2000 + expYear, expMonth)
    if (expDate <= now) {
      return reply.code(422).send({ error: 'Cartao vencido' })
    }

    // Validar installments: inteiro de 1 a 12
    const parsedInstallments = installments != null ? installments : 1
    if (!Number.isInteger(parsedInstallments) || parsedInstallments < 1 || parsedInstallments > 12) {
      return reply.code(422).send({ error: 'installments deve ser de 1 a 12' })
    }

    // Validar description: max 100 caracteres
    if (typeof description !== 'string' || description.trim().length === 0 || description.length > 100) {
      return reply.code(422).send({ error: 'description invalida' })
    }

    // Checar idempotencia
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: idempotency_key },
    })
    if (existing) {
      return reply.code(200).send(formatTransaction(existing))
    }

    // Cartao comecando com 9999 = declined
    const isDeclined = card_number.startsWith('9999')

    // Detectar bandeira
    const brand = getBrand(card_number)
    if (!brand && !isDeclined) {
      return reply.code(422).send({ error: 'Bandeira nao suportada' })
    }

    // Para cartoes declined sem bandeira valida, usar valores zerados
    const brandFee = brand ? brand.fee : 0
    const brandName = brand ? brand.name : 'unknown'
    const cardLast4 = card_number.slice(-4)

    // Calcular juros compostos
    const totalWithInterest = calculateInterest(amount_cents, parsedInstallments)
    const installmentAmount = Math.ceil(totalWithInterest / parsedInstallments)

    // Verificar minimo por parcela
    if (installmentAmount < MIN_INSTALLMENT_CENTS) {
      return reply.code(422).send({ error: 'Valor minimo por parcela e R$10,00' })
    }

    // Calcular taxa da bandeira sobre amount_cents (IDEIA.md: "A taxa e calculada sobre o amount_cents")
    const feeCents = Math.ceil(amount_cents * brandFee)
    // net_amount = amount_cents - fee_cents (IDEIA.md linha 829)
    const netAmount = amount_cents - feeCents

    // Checar limite diario e salvar em transacao atomica
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    try {
      const tx = await withRetry(() =>
        prisma.$transaction(async (prismaClient) => {
          // Checar limite diario (so se for approved)
          if (!isDeclined) {
            const dailyTotal = await prismaClient.transaction.aggregate({
              where: {
                cardLast4,
                status: 'approved',
                createdAt: {
                  gte: today,
                  lt: tomorrow,
                },
              },
              _sum: { totalWithInterest: true },
            })

            const usedToday = dailyTotal._sum.totalWithInterest ?? 0
            if (usedToday + totalWithInterest > DAILY_LIMIT_CENTS) {
              throw new Error('DAILY_LIMIT_EXCEEDED')
            }
          }

          return prismaClient.transaction.create({
            data: {
              id: uuidv4(),
              idempotencyKey: idempotency_key,
              status: isDeclined ? 'declined' : 'approved',
              cardLast4,
              cardBrand: brandName,
              holderName: holder_name,
              amountCents: amount_cents,
              installments: parsedInstallments,
              installmentAmount,
              totalWithInterest: totalWithInterest,
              feeCents,
              netAmount,
              description,
            },
          })
        })
      )

      return reply.code(201).send(formatTransaction(tx))
    } catch (err) {
      if (err.message === 'DAILY_LIMIT_EXCEEDED') {
        return reply.code(422).send({ error: 'Limite diario excedido' })
      }
      // Idempotency race condition - another request created it first
      if (err.code === 'P2002') {
        const existing = await prisma.transaction.findUnique({
          where: { idempotencyKey: idempotency_key },
        })
        if (existing) {
          return reply.code(200).send(formatTransaction(existing))
        }
      }
      throw err
    }
  })

  // GET /api/transactions/:id -- consultar transacao
  fastify.get('/transactions/:id', async (req, reply) => {
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    })
    if (!tx) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return formatTransaction(tx)
  })

  // GET /api/transactions?page=1&limit=10 -- listar com paginacao
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

  // POST /api/transactions/:id/refund -- estornar transacao
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    const { id } = req.params

    const tx = await prisma.transaction.findUnique({ where: { id } })
    if (!tx) {
      return reply.code(404).send({ error: 'Transacao nao encontrada' })
    }
    if (tx.status !== 'approved') {
      return reply.code(422).send({ error: 'Somente transacoes aprovadas podem ser estornadas' })
    }

    // Atomically update only if still approved (prevents double refund)
    const result = await withRetry(() =>
      prisma.transaction.updateMany({
        where: { id, status: 'approved' },
        data: { status: 'refunded' },
      })
    )

    if (result.count === 0) {
      return reply.code(422).send({ error: 'Transacao ja foi estornada' })
    }

    const updated = await prisma.transaction.findUnique({ where: { id } })
    return formatTransaction(updated)
  })
}

// Formata a transacao do Prisma para o formato da API
function formatTransaction(tx) {
  return {
    id: tx.id,
    idempotency_key: tx.idempotencyKey,
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
