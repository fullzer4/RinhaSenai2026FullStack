const BASE = '/api'

async function request(method, path, body) {
  const opts = { method, headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { /* sem corpo JSON */ }
  return { ok: res.ok, status: res.status, data }
}

export function getBalance() {
  return request('GET', '/balance')
}

export function createTransaction(payload) {
  return request('POST', '/transactions', payload)
}

export function getTransactions(page, limit) {
  return request('GET', `/transactions?page=${page}&limit=${limit}`)
}

export function getTransaction(id) {
  return request('GET', `/transactions/${id}`)
}

export function refundTransaction(id) {
  return request('POST', `/transactions/${id}/refund`)
}

export function formatCents(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
