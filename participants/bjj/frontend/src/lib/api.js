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
  try { data = text ? JSON.parse(text) : null } catch { /* resposta nao-JSON */ }
  return { status: res.status, ok: res.ok, data }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
}

export function formatCents(cents) {
  const value = (Number(cents) || 0) / 100
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const BRAND_LABEL = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  elo: 'Elo',
}

export function brandLabel(brand) {
  return BRAND_LABEL[brand] || brand
}

const STATUS_LABEL = {
  approved: 'Aprovada',
  declined: 'Recusada',
  refunded: 'Estornada',
}

export function statusLabel(status) {
  return STATUS_LABEL[status] || status
}
