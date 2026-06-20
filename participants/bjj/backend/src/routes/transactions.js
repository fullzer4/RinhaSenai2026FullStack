import prisma from '../db.js'
import { writeMutex } from '../lib/mutex.js'
import {
  detectBrand, isDeclinedCard, calculateAmounts, validatePayload,
  serializeTransaction, DAILY_LIMIT_CENTS,
} from '../lib/rules.js'
import { transactionListResponseSchema, balanceResponseSchema } from '../lib/schemas.js'

// Erro especifico do SQLite/libsql para violacao de constraint UNIQUE.
// Serve como segunda linha de defesa de idempotencia (a primeira e o
// SELECT dentro do mutex), cobrindo o caso raro de duas escritas
// concorrentes vindas de processos/conexoes diferentes.
function isUniqueConstraintError(err) {
  const msg = String(err?.message || err?.code || '')
  return msg.includes('UNIQUE') || msg.includes('SQLITE_CONSTRAINT')
}

export default async function (fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }))

  // ------------------------------------------------------------------
  // GET /api/balance
  // Soma apenas transacoes approved (declined e refunded nao contam
  // no saldo liquido, conforme regra de negocio).
  // ------------------------------------------------------------------
  fastify.get('/balance', { schema: { response: balanceResponseSchema } }, async (req, reply) => {
    const [approvedSum, approvedCount, declinedCount, refundedCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'approved' },
        _sum: { netAmount: true },
      }),
      prisma.transaction.count({ where: { status: 'approved' } }),
      prisma.transaction.count({ where: { status: 'declined' } }),
      prisma.transaction.count({ where: { status: 'refunded' } }),
    ])

    return {
      balance_cents: approvedSum._sum.netAmount || 0,
      total_approved: approvedCount,
      total_declined: declinedCount,
      total_refunded: refundedCount,
    }
  })

  // ------------------------------------------------------------------
  // POST /api/transactions
  //
  // Estrategia de concorrencia (ver lib/mutex.js para a justificativa
  // completa): toda a secao critica -- lookup de idempotencia, soma do
  // limite diario, e insercao -- roda dentro do writeMutex, que serializa
  // escritas no nivel da aplicacao. Isso transforma o classico problema
  // de "check-then-act" (TOCTOU) em uma operacao atomica por construcao,
  // sem precisar de locks explicitos no SQLite.
  // ------------------------------------------------------------------
  fastify.post('/transactions', async (req, reply) => {
    const body = req.body || {}

    const errors = validatePayload(body)
    if (errors.length > 0) {
      return reply.code(422).send({ error: 'validation_error', details: errors })
    }

    const {
      card_number, holder_name, expiration, cvv,
      amount_cents, installments = 1, description, idempotency_key,
    } = body

    // IMPORTANTE: a checagem de "cartao de teste sempre recusado" (9999...)
    // precisa vir antes da exigencia de bandeira valida. O digito '9' nao
    // mapeia para nenhuma bandeira conhecida (4/5/3/6), entao sem essa
    // ordem um cartao 9999... seria rejeitado com 422 (bandeira invalida)
    // em vez de ser salvo como declined (conforme a regra de negocio).
    const declined = isDeclinedCard(card_number)
    const brandInfo = detectBrand(card_number)

    if (!declined && !brandInfo) {
      return reply.code(422).send({ error: 'unknown_card_brand' })
    }

    // Quando declined por ser cartao de teste sem bandeira reconhecida,
    // nao ha taxa de bandeira real a aplicar -- usamos rate 0 apenas para
    // fins de calculo de exibicao (fee_cents = 0), e gravamos card_brand
    // como 'unknown'. Se o cartao 9999... por acaso tiver um prefixo de
    // bandeira valido (ex.: nunca ocorre, pois 9 não é 4/5/3/6, mas
    // mantemos a logica generica para clareza), usamos a bandeira real.
    const effectiveRate = brandInfo ? brandInfo.rate : 0

    const calc = calculateAmounts(amount_cents, installments, effectiveRate)
    if (calc === null) {
      return reply.code(422).send({ error: 'installment_below_minimum' })
    }

    const cardLast4 = card_number.slice(-4)

    try {
      const { created, tx } = await writeMutex.run(async () => {
        // 1) Idempotencia -- replay de uma chamada anterior identica.
        //    Retornamos a transacao ja existente sem tocar no banco de novo.
        if (idempotency_key) {
          const existing = await prisma.transaction.findUnique({
            where: { idempotencyKey: idempotency_key },
          })
          if (existing) {
            return { created: false, tx: existing }
          }
        }

        // 2) Limite diario -- soma apenas approved de HOJE para este cartao.
        //    Como estamos dentro do mutex, nenhuma outra escrita pode
        //    acontecer entre este SELECT e o INSERT abaixo: a checagem e
        //    o commit sao logicamente atomicos.
        let finalStatus = 'approved'
        if (!declined) {
          const startOfDay = new Date()
          startOfDay.setHours(0, 0, 0, 0)

          const agg = await prisma.transaction.aggregate({
            where: {
              cardLast4,
              status: 'approved',
              createdAt: { gte: startOfDay },
            },
            _sum: { amountCents: true },
          })
          const dailyTotal = agg._sum.amountCents || 0

          if (dailyTotal + amount_cents > DAILY_LIMIT_CENTS) {
            finalStatus = 'declined'
          }
        } else {
          finalStatus = 'declined'
        }

        const created = await prisma.transaction.create({
          data: {
            status: finalStatus,
            cardLast4,
            cardBrand: brandInfo ? brandInfo.brand : 'unknown',
            holderName: holder_name,
            amountCents: amount_cents,
            installments,
            installmentAmount: calc.installmentAmount,
            totalWithInterest: calc.totalWithInterest,
            feeCents: calc.feeCents,
            netAmount: calc.netAmount,
            description,
            idempotencyKey: idempotency_key || null,
          },
        })

        return { created: true, tx: created }
      })

      reply.code(created ? 201 : 200)
      return serializeTransaction(tx)
    } catch (err) {
      // Defesa secundaria: corrida rara entre o SELECT de idempotencia e o
      // INSERT vinda de fora do processo (ex.: multiplas instancias do
      // servidor apontando para o mesmo arquivo). O mutex em processo unico
      // ja deveria ter prevenido isso; aqui so garantimos uma resposta
      // correta em vez de 500.
      if (isUniqueConstraintError(err)) {
        const existing = await prisma.transaction.findUnique({
          where: { idempotencyKey: idempotency_key },
        })
        if (existing) {
          reply.code(200)
          return serializeTransaction(existing)
        }
      }
      req.log.error(err)
      return reply.code(500).send({ error: 'internal_error' })
    }
  })

  // ------------------------------------------------------------------
  // GET /api/transactions/:id
  // ------------------------------------------------------------------
  fastify.get('/transactions/:id', async (req, reply) => {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } })
    if (!tx) {
      return reply.code(404).send({ error: 'not_found' })
    }
    return serializeTransaction(tx)
  })

  // ------------------------------------------------------------------
  // GET /api/transactions?page=&limit=
  // ------------------------------------------------------------------
  fastify.get('/transactions', { schema: { response: transactionListResponseSchema } }, async (req, reply) => {
    let page = parseInt(req.query.page, 10)
    let limit = parseInt(req.query.limit, 10)
    if (!Number.isInteger(page) || page < 1) page = 1
    if (!Number.isInteger(limit) || limit < 1) limit = 10
    if (limit > 100) limit = 100

    const [total, rows] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      data: rows.map(serializeTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  })

  // ------------------------------------------------------------------
  // POST /api/transactions/:id/refund
  //
  // Defesa contra double refund em duas camadas:
  //   1) writeMutex -- serializa, evitando contencao no SQLite.
  //   2) UPDATE ... WHERE id = ? AND status = 'approved' -- mesmo que o
  //      mutex nao existisse, essa update e atomica no nivel do SQLite:
  //      apenas UMA das chamadas concorrentes vai casar com a clausula
  //      WHERE (a primeira a comitar muda o status; as demais acham 0
  //      linhas afetadas porque o status ja nao e mais 'approved').
  // ------------------------------------------------------------------
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    const { id } = req.params

    const result = await writeMutex.run(async () => {
      const updateResult = await prisma.transaction.updateMany({
        where: { id, status: 'approved' },
        data: { status: 'refunded' },
      })

      if (updateResult.count === 0) {
        const existing = await prisma.transaction.findUnique({ where: { id } })
        if (!existing) {
          return { ok: false, code: 404, body: { error: 'not_found' } }
        }
        return {
          ok: false,
          code: 422,
          body: { error: 'invalid_refund_state', current_status: existing.status },
        }
      }

      const updated = await prisma.transaction.findUnique({ where: { id } })
      return { ok: true, tx: updated }
    })

    if (!result.ok) {
      return reply.code(result.code).send(result.body)
    }
    return serializeTransaction(result.tx)
  })
}
