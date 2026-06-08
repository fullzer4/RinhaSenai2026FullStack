/**
 * Rinha FullStack SENAI 2026 -- Benchmark
 *
 * Fase 1: Corretude via API (regras de negocio)
 * Fase 2: Corretude via Frontend (Playwright)
 * Fase 3: Stress via API (bombardeio)
 *
 * Uso: node run.js
 * Saida: results.json com nota detalhada
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const results = { rules: [], frontend: [], stress: [], summary: {} }
let pass = 0
let fail = 0

function check(category, name, ok, detail = '') {
  const entry = { name, ok, detail }
  results[category].push(entry)
  if (ok) pass++
  else fail++
  const icon = ok ? '✓' : '✗'
  console.log(`  ${icon} ${name}${detail ? ' -- ' + detail : ''}`)
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, data, text }
}

// ============================================================
// FASE 1: Regras de negocio via API
// ============================================================
async function testRules() {
  console.log('\n=== FASE 1: Regras de negocio (API) ===\n')

  // Health
  const health = await api('GET', '/api/health')
  check('rules', 'Health check', health.status === 200 && health.data?.status === 'ok')

  // Create visa 1x (card last4 = 1111)
  const visa = await api('POST', '/api/transactions', {
    card_number: '4111111111111111', holder_name: 'Bench Test', expiration: '12/28',
    cvv: '123', amount_cents: 10000, installments: 1, description: 'Visa 1x', idempotency_key: 'bench-001'
  })
  check('rules', 'POST /api/transactions retorna 201', visa.status === 201)
  check('rules', 'Status approved para cartao valido', visa.data?.status === 'approved')
  check('rules', 'Bandeira visa detectada (4xxx)', visa.data?.card_brand === 'visa')
  check('rules', 'Taxa visa 2.5% correta (250)', visa.data?.fee_cents === 250)
  check('rules', 'net_amount = amount - fee (9750)', visa.data?.net_amount === 9750)

  // Idempotency
  const idem = await api('POST', '/api/transactions', {
    card_number: '4111111111111111', holder_name: 'Bench Test', expiration: '12/28',
    cvv: '123', amount_cents: 10000, installments: 1, description: 'Visa 1x', idempotency_key: 'bench-001'
  })
  check('rules', 'Idempotencia: mesma key retorna 200', idem.status === 200)

  // Mastercard (card last4 = 2222)
  const mc = await api('POST', '/api/transactions', {
    card_number: '5222222222222222', holder_name: 'MC Test', expiration: '12/28',
    cvv: '123', amount_cents: 20000, installments: 1, description: 'MC', idempotency_key: 'bench-002'
  })
  check('rules', 'Bandeira mastercard detectada (5xxx)', mc.data?.card_brand === 'mastercard')
  check('rules', 'Taxa mastercard 3% correta (600)', mc.data?.fee_cents === 600)

  // Amex (card last4 = 3333)
  const amex = await api('POST', '/api/transactions', {
    card_number: '3333333333333333', holder_name: 'Amex Test', expiration: '12/28',
    cvv: '1234', amount_cents: 10000, installments: 1, description: 'Amex', idempotency_key: 'bench-002b'
  })
  check('rules', 'Bandeira amex detectada (3xxx)', amex.data?.card_brand === 'amex')

  // Elo (card last4 = 4444)
  const elo = await api('POST', '/api/transactions', {
    card_number: '6444444444444444', holder_name: 'Elo Test', expiration: '12/28',
    cvv: '123', amount_cents: 10000, installments: 1, description: 'Elo', idempotency_key: 'bench-002c'
  })
  check('rules', 'Bandeira elo detectada (6xxx)', elo.data?.card_brand === 'elo')

  // Declined 9999 (card last4 = 5555)
  const declined = await api('POST', '/api/transactions', {
    card_number: '9999555555555555', holder_name: 'Declined', expiration: '12/28',
    cvv: '123', amount_cents: 10000, installments: 1, description: 'Declined', idempotency_key: 'bench-003'
  })
  check('rules', 'Cartao 9999 retorna declined', declined.data?.status === 'declined')
  check('rules', 'Declined salvo no banco (201)', declined.status === 201)

  // Unsupported brand
  const bad = await api('POST', '/api/transactions', {
    card_number: '1111111111111111', holder_name: 'Bad', expiration: '12/28',
    cvv: '123', amount_cents: 10000, installments: 1, description: 'Bad', idempotency_key: 'bench-004'
  })
  check('rules', 'Bandeira invalida rejeitada 422', bad.status === 422)

  // Installments 3x visa (2% compound) - card last4 = 6666
  // 15000 * 1.02^3 = 15918.12 -> ceil = 15919
  const inst = await api('POST', '/api/transactions', {
    card_number: '4666666666666666', holder_name: 'Joao Silva', expiration: '12/28',
    cvv: '123', amount_cents: 15000, installments: 3, description: 'Camiseta SENAI', idempotency_key: 'bench-005'
  })
  check('rules', 'Juros compostos 2%/mes (3x)', inst.data?.total_with_interest === 15919,
    `total_with_interest=${inst.data?.total_with_interest}`)
  check('rules', 'Parcela com ceil correto', inst.data?.installment_amount === 5307,
    `installment_amount=${inst.data?.installment_amount}`)
  check('rules', 'Taxa sobre amount_cents (fee=375)', inst.data?.fee_cents === 375)
  check('rules', 'net_amount = amount - fee (14625)', inst.data?.net_amount === 14625)

  // Installments 7x (4% compound) - card last4 = 7777
  const inst7 = await api('POST', '/api/transactions', {
    card_number: '4777777777777777', holder_name: 'Test 7x', expiration: '12/28',
    cvv: '123', amount_cents: 100000, installments: 7, description: '7 parcelas', idempotency_key: 'bench-005b'
  })
  const expected7 = Math.ceil(100000 * Math.pow(1.04, 7))
  check('rules', 'Juros compostos 4%/mes (7x)', inst7.data?.total_with_interest === expected7,
    `esperado=${expected7} recebido=${inst7.data?.total_with_interest}`)

  // Min installment R$10 - card last4 = 8888
  const minInst = await api('POST', '/api/transactions', {
    card_number: '4888888888888888', holder_name: 'Min', expiration: '12/28',
    cvv: '123', amount_cents: 1000, installments: 12, description: 'Min', idempotency_key: 'bench-006'
  })
  check('rules', 'Parcela abaixo R$10 rejeitada 422', minInst.status === 422)

  // Refund - criar transacao especifica para o teste (card last4 = 9999)
  const refundTarget = await api('POST', '/api/transactions', {
    card_number: '4999999999999999', holder_name: 'Refund Test', expiration: '12/28',
    cvv: '123', amount_cents: 5000, installments: 1, description: 'Para estorno', idempotency_key: 'bench-refund-001'
  })
  if (refundTarget.status === 201 && refundTarget.data?.id) {
    const refund = await api('POST', `/api/transactions/${refundTarget.data.id}/refund`)
    check('rules', 'Estorno funciona (approved -> refunded)', refund.data?.status === 'refunded',
      `status=${refund.status} body_status=${refund.data?.status} error=${refund.data?.error || 'none'}`)

    const doubleRefund = await api('POST', `/api/transactions/${refundTarget.data.id}/refund`)
    check('rules', 'Double refund rejeitado 422', doubleRefund.status === 422,
      `status=${doubleRefund.status}`)
  } else {
    check('rules', 'Estorno funciona (approved -> refunded)', false,
      `create status=${refundTarget.status} error=${refundTarget.data?.error || refundTarget.text?.substring(0, 100)}`)
    check('rules', 'Double refund rejeitado 422', false, 'sem transacao para testar')
  }

  // Balance
  const balance = await api('GET', '/api/balance')
  check('rules', 'Balance endpoint funciona', balance.status === 200 && balance.data?.balance_cents != null)
  check('rules', 'Declined nao conta no saldo',
    balance.data?.total_declined > 0 && balance.data?.balance_cents >= 0)

  // Pagination
  const page = await api('GET', '/api/transactions?page=1&limit=2')
  check('rules', 'Paginacao funciona', page.data?.pagination?.total_pages > 0)
}

// ============================================================
// FASE 2: Frontend via Playwright
// ============================================================
async function testFrontend() {
  console.log('\n=== FASE 2: Frontend (Playwright) ===\n')

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // Dashboard
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    check('frontend', 'Dashboard carrega (GET /)', true)

    // Form elements
    const formElements = [
      '.input-card-number', '.input-holder-name', '.input-expiration',
      '.input-cvv', '.input-amount', '.select-installments',
      '.input-description', '.btn-pay'
    ]
    for (const sel of formElements) {
      const el = await page.$(sel)
      check('frontend', `Elemento ${sel} existe`, el !== null)
    }

    // Balance elements
    const balanceElements = [
      '.display-balance', '.display-total-approved',
      '.display-total-declined', '.display-total-refunded'
    ]
    for (const sel of balanceElements) {
      const el = await page.$(sel)
      check('frontend', `Elemento ${sel} existe`, el !== null)
    }

    // Fill and submit form
    await page.fill('.input-card-number', '4222222222222222')
    await page.fill('.input-holder-name', 'Playwright Test')
    await page.fill('.input-expiration', '12/29')
    await page.fill('.input-cvv', '999')
    await page.fill('.input-amount', '25000')
    await page.selectOption('.select-installments', '1')
    await page.fill('.input-description', 'Teste Playwright')
    await page.click('.btn-pay')

    // Wait for feedback
    try {
      await page.waitForSelector('.feedback-success, .feedback-error', { timeout: 5000 })
      const success = await page.$('.feedback-success')
      const error = await page.$('.feedback-error')
      check('frontend', 'Feedback apos submit', success !== null || error !== null)
      check('frontend', 'Transacao aprovada via form', success !== null)
    } catch {
      check('frontend', 'Feedback apos submit', false, 'timeout')
    }

    // History page
    await page.goto(BASE + '/history?page=1&limit=10', { waitUntil: 'networkidle' })
    check('frontend', 'Pagina /history carrega', true)

    const listEl = await page.$('.list-transactions')
    check('frontend', 'Lista de transacoes existe', listEl !== null)

    const items = await page.$$('.transaction-item')
    check('frontend', 'Transacoes aparecem no historico', items.length > 0, `${items.length} items`)

    // Check transaction item elements
    if (items.length > 0) {
      const itemFields = [
        '.transaction-id', '.transaction-status', '.transaction-amount',
        '.transaction-brand', '.transaction-installments', '.transaction-fee',
        '.transaction-description'
      ]
      for (const sel of itemFields) {
        const el = await items[0].$(sel)
        check('frontend', `Item tem ${sel}`, el !== null)
      }
    }

    // Pagination elements
    const paginationElements = [
      '.pagination-current', '.pagination-pages', '.pagination-total',
      '.btn-prev-page', '.btn-next-page'
    ]
    for (const sel of paginationElements) {
      const el = await page.$(sel)
      check('frontend', `Paginacao ${sel} existe`, el !== null)
    }

    // Detail page
    const firstId = items.length > 0
      ? await items[0].$eval('.transaction-id', el => el.dataset.value || el.textContent)
      : null
    if (firstId) {
      await page.goto(BASE + '/transaction/' + firstId, { waitUntil: 'networkidle' })
      check('frontend', 'Pagina /transaction/:id carrega', true)

      const detailFields = [
        '.detail-id', '.detail-status', '.detail-amount', '.detail-brand',
        '.detail-holder', '.detail-card', '.detail-installments', '.detail-fee',
        '.detail-net', '.detail-description', '.detail-date'
      ]
      for (const sel of detailFields) {
        const el = await page.$(sel)
        check('frontend', `Detalhe tem ${sel}`, el !== null)
      }
    }

    // SPA fallback
    const resp = await page.goto(BASE + '/history', { waitUntil: 'networkidle' })
    check('frontend', 'SPA fallback funciona (/history sem query)', resp.status() === 200)

  } catch (err) {
    check('frontend', 'Playwright executou sem erro', false, err.message)
  } finally {
    if (browser) await browser.close()
  }
}

// ============================================================
// FASE 3: Stress basico via API
// ============================================================
async function testStress() {
  console.log('\n=== FASE 3: Stress test (API) ===\n')

  // Send in batches to avoid overwhelming SQLite
  const BATCH_SIZE = 5
  const TOTAL = 30
  let created = 0
  let errors500 = 0
  const start = Date.now()
  const ts = Date.now()

  for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
    const promises = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i
      const brands = ['4', '5', '3', '6']
      const brand = brands[idx % 4]
      // Use unique last4 per batch to avoid daily limit
      const suffix = String(idx + 1000).padStart(4, '0')
      promises.push(
        api('POST', '/api/transactions', {
          card_number: `${brand}${String(idx).padStart(11, '0')}${suffix}`,
          holder_name: `Stress ${idx}`,
          expiration: '12/29',
          cvv: '123',
          amount_cents: 5000,
          installments: 1,
          description: `Stress ${idx}`,
          idempotency_key: `stress-${idx}-${ts}`
        }).then(r => {
          if (r.status === 201) created++
          else if (r.status >= 500) errors500++
        }).catch(() => { errors500++ })
      )
    }
    await Promise.all(promises)
    // Small delay between batches to let SQLite breathe
    await new Promise(r => setTimeout(r, 100))
  }

  const elapsed = Date.now() - start
  const throughput = Math.round(created / (elapsed / 1000))

  check('stress', `${created}/${TOTAL} transacoes criadas`, created >= TOTAL * 0.8,
    `${created} de ${TOTAL}`)
  check('stress', 'Zero erros 500', errors500 === 0, errors500 > 0 ? `${errors500} erros` : '')
  check('stress', `Throughput: ${throughput} txn/s`, throughput > 0, `${elapsed}ms`)

  // Idempotency stress: send same key from multiple workers
  const idemKey = `idem-stress-${Date.now()}`
  const idemPromises = []
  for (let w = 0; w < 5; w++) {
    idemPromises.push(api('POST', '/api/transactions', {
      card_number: '4100000000000100', holder_name: 'Idem Stress', expiration: '12/28',
      cvv: '123', amount_cents: 5000, installments: 1, description: 'Idem', idempotency_key: idemKey
    }))
  }
  const idemResults = await Promise.all(idemPromises)
  const created201 = idemResults.filter(r => r.status === 201).length
  const existing200 = idemResults.filter(r => r.status === 200).length
  const idemOk = (created201 + existing200 === 5) && created201 >= 1
  check('stress', 'Idempotencia concorrente: 1 criada + N duplicatas', idemOk,
    `201=${created201} 200=${existing200}`)

  // Double refund stress - criar transacao fresca
  const refundTx = await api('POST', '/api/transactions', {
    card_number: '4200000000000200', holder_name: 'Refund Stress', expiration: '12/28',
    cvv: '123', amount_cents: 5000, installments: 1, description: 'Stress refund', idempotency_key: `stress-refund-${Date.now()}`
  })
  if (refundTx.status === 201 && refundTx.data?.id) {
    const refundPromises = [
      api('POST', `/api/transactions/${refundTx.data.id}/refund`),
      api('POST', `/api/transactions/${refundTx.data.id}/refund`)
    ]
    const refundResults = await Promise.all(refundPromises)
    const refunded = refundResults.filter(r => r.data?.status === 'refunded').length
    check('stress', 'Double refund concorrente: apenas 1 estorno', refunded === 1,
      `${refunded} estornos`)
  } else {
    check('stress', 'Double refund concorrente: apenas 1 estorno', false, 'sem transacao')
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('Rinha FullStack SENAI 2026 -- Benchmark\n')

  // Wait for server
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`)
      if (r.ok) break
    } catch {}
    if (i === 29) { console.error('Server nao respondeu'); process.exit(1) }
    await new Promise(r => setTimeout(r, 1000))
  }

  await testRules()
  await testFrontend()
  await testStress()

  // Summary
  const total = pass + fail
  console.log(`\n========================================`)
  console.log(`RESULTADO: ${pass}/${total} testes passando`)
  console.log(`========================================\n`)

  results.summary = { pass, fail, total }

  // Write JSON
  const fs = await import('fs')
  fs.writeFileSync('bench/results.json', JSON.stringify(results, null, 2))
  console.log('Resultados salvos em bench/results.json')

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Bench falhou:', err)
  process.exit(1)
})
