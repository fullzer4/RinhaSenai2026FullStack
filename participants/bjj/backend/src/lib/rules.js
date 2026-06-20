// Regras de negocio puras, sem I/O. Mantidas isoladas para serem
// testaveis e para deixar a rota (transactions.js) focada em orquestracao
// de concorrencia / banco.

export const DAILY_LIMIT_CENTS = 500000
export const MIN_INSTALLMENT_CENTS = 1000
export const MAX_AMOUNT_CENTS = 1000000

// Mapa de bandeira por primeiro digito do cartao.
const BRAND_RULES = {
  '4': { brand: 'visa', rate: 0.025 },
  '5': { brand: 'mastercard', rate: 0.03 },
  '3': { brand: 'amex', rate: 0.035 },
  '6': { brand: 'elo', rate: 0.04 },
}

export function detectBrand(cardNumber) {
  const first = cardNumber[0]
  return BRAND_RULES[first] || null
}

export function isDeclinedCard(cardNumber) {
  return cardNumber.startsWith('9999')
}

// Taxa de juros mensal composta por faixa de parcelas.
function interestRateFor(installments) {
  if (installments <= 1) return 0
  if (installments <= 6) return 0.02
  return 0.04
}

/**
 * Calcula todos os valores financeiros de uma transacao.
 * Retorna null se a parcela ficar abaixo do minimo permitido.
 */
export function calculateAmounts(amountCents, installments, brandRate) {
  const rate = interestRateFor(installments)
  const totalWithInterestRaw = amountCents * Math.pow(1 + rate, installments)
  const totalWithInterest = Math.ceil(totalWithInterestRaw)
  const installmentAmount = Math.ceil(totalWithInterest / installments)

  if (installmentAmount < MIN_INSTALLMENT_CENTS) {
    return null
  }

  const feeCents = Math.round(amountCents * brandRate)
  const netAmount = amountCents - feeCents

  return { totalWithInterest, installmentAmount, feeCents, netAmount }
}

// --- Validacao de payload -------------------------------------------------

const CARD_NUMBER_RE = /^\d{16}$/
const CVV_RE = /^\d{3,4}$/
const EXPIRATION_RE = /^(0[1-9]|1[0-2])\/\d{2}$/
const HTML_TAG_RE = /<[^>]*>/

export function validatePayload(body) {
  const errors = []

  if (typeof body !== 'object' || body === null) {
    return ['Payload invalido']
  }

  const {
    card_number, holder_name, expiration, cvv,
    amount_cents, installments = 1, description,
  } = body

  if (typeof card_number !== 'string' || !CARD_NUMBER_RE.test(card_number)) {
    errors.push('card_number deve ter exatamente 16 digitos numericos')
  }

  if (typeof holder_name !== 'string' || holder_name.trim().length === 0 || holder_name.length > 50 || HTML_TAG_RE.test(holder_name)) {
    errors.push('holder_name invalido')
  }

  if (typeof expiration !== 'string' || !EXPIRATION_RE.test(expiration)) {
    errors.push('expiration deve estar no formato MM/YY')
  } else {
    const [mm, yy] = expiration.split('/').map(Number)
    // Considera o cartao valido até o ultimo dia do mes de expiracao.
    const expDate = new Date(2000 + yy, mm, 1) // primeiro dia do mes seguinte
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    if (expDate <= currentMonthStart) {
      errors.push('cartao vencido')
    }
  }

  if (typeof cvv !== 'string' || !CVV_RE.test(cvv)) {
    errors.push('cvv deve ter 3 ou 4 digitos numericos')
  }

  if (!Number.isInteger(amount_cents) || amount_cents <= 0 || amount_cents > MAX_AMOUNT_CENTS) {
    errors.push('amount_cents deve ser > 0 e <= 1000000')
  }

  if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
    errors.push('installments deve ser um inteiro de 1 a 12')
  }

  if (typeof description !== 'string' || description.trim().length === 0 || description.length > 100) {
    errors.push('description obrigatoria, max 100 caracteres')
  }

  return errors
}

export function serializeTransaction(tx) {
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
    created_at: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
  }
}
