import prisma from '../db.js'
import { libsql } from '../db.js'

// ── Brand detection ──
const BRANDS = { '4': { name: 'visa', rate: 0.025 }, '5': { name: 'mastercard', rate: 0.03 }, '3': { name: 'amex', rate: 0.035 }, '6': { name: 'elo', rate: 0.04 } }

// ── Validation helpers ──
const RE_DIGITS_16 = /^\d{16}$/
const RE_CVV = /^\d{3,4}$/
const RE_EXPIRATION = /^(0[1-9]|1[0-2])\/(\d{2})$/
const RE_HTML_TAG = /<[^>]*>/

function validateBody(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  const { card_number, cvv, holder_name, expiration, amount_cents, installments, description } = body

  if (typeof card_number !== 'string' || !RE_DIGITS_16.test(card_number)) return 'card_number must be exactly 16 digits'
  if (typeof cvv !== 'string' || !RE_CVV.test(cvv)) return 'cvv must be 3 or 4 digits'
  if (typeof holder_name !== 'string' || holder_name.trim().length === 0 || holder_name.length > 50 || RE_HTML_TAG.test(holder_name)) return 'holder_name invalid'
  if (typeof expiration !== 'string' || !RE_EXPIRATION.test(expiration)) return 'expiration must be MM/YY format'

  // Check not expired
  const match = RE_EXPIRATION.exec(expiration)
  const expMonth = parseInt(match[1], 10)
  const expYear = 2000 + parseInt(match[2], 10)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) return 'Card expired'

  if (typeof amount_cents !== 'number' || !Number.isInteger(amount_cents) || amount_cents <= 0 || amount_cents > 1000000) return 'amount_cents must be integer > 0 and <= 1000000'

  const inst = installments ?? 1
  if (typeof inst !== 'number' || !Number.isInteger(inst) || inst < 1 || inst > 12) return 'installments must be 1-12'

  if (typeof description !== 'string' || description.trim().length === 0 || description.length > 100) return 'description is required and max 100 chars'

  return null
}

// ── Map for in-flight idempotency requests ──
const inFlightKeys = new Map()

export default async function (fastify) {

  // ── Health ──
  fastify.get('/health', async () => ({ status: 'ok' }))

  // ── Reset ──
  fastify.delete('/reset', async (req, reply) => {
    await libsql.execute('DELETE FROM transactions')
    return reply.code(200).send({ message: 'reset ok' })
  })

  // ── Balance ──
  fastify.get('/balance', async (req, reply) => {
    const rows = await libsql.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'approved' THEN net_amount ELSE 0 END), 0) AS balance_cents,
         COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) AS total_approved,
         COALESCE(SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END), 0) AS total_declined,
         COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) AS total_refunded
       FROM transactions`
    )
    const row = rows.rows[0]
    return {
      balance_cents: Number(row.balance_cents),
      total_approved: Number(row.total_approved),
      total_declined: Number(row.total_declined),
      total_refunded: Number(row.total_refunded),
    }
  })

  // ── Create Transaction ──
  fastify.post('/transactions', async (req, reply) => {
    const body = req.body
    const installments = body?.installments ?? 1

    // Validation
    const err = validateBody(body)
    if (err) return reply.code(422).send({ error: err })

    const { card_number, holder_name, expiration, cvv, amount_cents, description } = body
    const idempotency_key = body.idempotency_key || null

    // Brand detection
    const firstDigit = card_number[0]
    let brand = BRANDS[firstDigit]

    if (card_number.startsWith('9999')) {
      brand = { name: 'unknown', rate: 0 }
    }

    if (!brand) return reply.code(422).send({ error: 'Unknown card brand' })

    // Interest calculation
    let interestRate = 0
    if (installments >= 2 && installments <= 6) interestRate = 0.02
    else if (installments >= 7 && installments <= 12) interestRate = 0.04

    const total_with_interest = installments === 1
      ? amount_cents
      : Math.ceil(amount_cents * Math.pow(1 + interestRate, installments))

    // Installment amount and minimum check
    const installment_amount = Math.ceil(total_with_interest / installments)
    if (total_with_interest / installments < 1000) {
      return reply.code(422).send({ error: 'Installment amount below minimum R$10.00' })
    }

    // Fee & net (calculated on amount_cents, per test expectations)
    const fee_cents = Math.round(amount_cents * brand.rate)
    const net_amount = amount_cents - fee_cents

    const card_last4 = card_number.slice(-4)

    // ── Idempotency check (in-flight dedup) ──
    if (idempotency_key) {
      // Check if another request with the same key is in-flight
      const existing = inFlightKeys.get(idempotency_key)
      if (existing) {
        // Wait for the in-flight request to complete
        const result = await existing
        return reply.code(200).send(result)
      }

      // Check if already in the database
      const dbCheck = await libsql.execute({
        sql: 'SELECT id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at FROM transactions WHERE idempotency_key = ?',
        args: [idempotency_key]
      })
      if (dbCheck.rows.length > 0) {
        const row = dbCheck.rows[0]
        return reply.code(200).send(mapRow(row))
      }
    }

    // Create a promise for in-flight tracking
    let resolveInFlight
    if (idempotency_key) {
      const promise = new Promise(resolve => { resolveInFlight = resolve })
      inFlightKeys.set(idempotency_key, promise)
    }

    try {
      // ── Determine status ──
      let status = 'approved'

      // Card starts with 9999 → declined
      if (card_number.startsWith('9999')) {
        status = 'declined'
      }

      // Daily limit check (only if still approved)
      if (status === 'approved') {
        const dailyResult = await libsql.execute({
          sql: `SELECT COALESCE(SUM(amount_cents), 0) AS daily_total FROM transactions WHERE card_last4 = ? AND status = 'approved' AND date(created_at) = date('now')`,
          args: [card_last4]
        })
        const dailyTotal = Number(dailyResult.rows[0].daily_total)
        if (dailyTotal + amount_cents > 500000) {
          status = 'declined'
        }
      }

      // ── Insert transaction ──
      const id = crypto.randomUUID()
      const now = new Date().toISOString()

      try {
        await libsql.execute({
          sql: `INSERT INTO transactions (id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, idempotency_key, status, card_last4, brand.name, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, now]
        })
      } catch (insertErr) {
        // UNIQUE constraint violation on idempotency_key → return existing
        if (insertErr.message && insertErr.message.includes('UNIQUE')) {
          const existing = await libsql.execute({
            sql: 'SELECT id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at FROM transactions WHERE idempotency_key = ?',
            args: [idempotency_key]
          })
          if (existing.rows.length > 0) {
            const result = mapRow(existing.rows[0])
            if (resolveInFlight) resolveInFlight(result)
            return reply.code(200).send(result)
          }
        }
        throw insertErr
      }

      const result = {
        id,
        status,
        card_last4,
        card_brand: brand.name,
        holder_name,
        amount_cents,
        installments,
        installment_amount,
        total_with_interest,
        fee_cents,
        net_amount,
        description,
        created_at: now,
      }

      if (resolveInFlight) resolveInFlight(result)
      return reply.code(201).send(result)
    } catch (error) {
      if (idempotency_key) inFlightKeys.delete(idempotency_key)
      throw error
    } finally {
      // Clean up in-flight map after a short delay
      if (idempotency_key) {
        setTimeout(() => inFlightKeys.delete(idempotency_key), 5000)
      }
    }
  })

  // ── Get Transaction by ID ──
  fastify.get('/transactions/:id', async (req, reply) => {
    const { id } = req.params
    const result = await libsql.execute({
      sql: 'SELECT id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at FROM transactions WHERE id = ?',
      args: [id]
    })
    if (result.rows.length === 0) return reply.code(404).send({ error: 'Transaction not found' })
    return mapRow(result.rows[0])
  })

  // ── List Transactions (paginated) ──
  fastify.get('/transactions', async (req, reply) => {
    let page = parseInt(req.query.page, 10) || 1
    let limit = parseInt(req.query.limit, 10) || 10
    if (page < 1) page = 1
    if (limit < 1) limit = 1
    if (limit > 100) limit = 100
    const offset = (page - 1) * limit

    const countResult = await libsql.execute('SELECT COUNT(*) AS total FROM transactions')
    const total = Number(countResult.rows[0].total)
    const total_pages = Math.ceil(total / limit) || 1

    const rows = await libsql.execute({
      sql: 'SELECT id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [limit, offset]
    })

    return {
      data: rows.rows.map(mapRow),
      pagination: { page, limit, total, total_pages }
    }
  })

  // ── Refund Transaction ──
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    const { id } = req.params

    // Atomic update: only refund if currently approved
    const result = await libsql.execute({
      sql: `UPDATE transactions SET status = 'refunded' WHERE id = ? AND status = 'approved'`,
      args: [id]
    })

    if (result.rowsAffected === 0) {
      // Check if transaction exists
      const check = await libsql.execute({ sql: 'SELECT status FROM transactions WHERE id = ?', args: [id] })
      if (check.rows.length === 0) return reply.code(404).send({ error: 'Transaction not found' })
      return reply.code(422).send({ error: 'Transaction cannot be refunded', current_status: check.rows[0].status })
    }

    // Fetch the updated transaction
    const updated = await libsql.execute({
      sql: 'SELECT id, idempotency_key, status, card_last4, card_brand, holder_name, amount_cents, installments, installment_amount, total_with_interest, fee_cents, net_amount, description, created_at FROM transactions WHERE id = ?',
      args: [id]
    })

    return mapRow(updated.rows[0])
  })
}

// ── Helper: map DB row to API response ──
function mapRow(row) {
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
    created_at: row.created_at,
  }
}
