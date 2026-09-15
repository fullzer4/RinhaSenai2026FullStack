// Cliente HTTP para a API - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 9: usado pelas páginas em src/pages/. Sempre retorna
// { ok, status, body } em vez de lançar exceção em respostas 4xx/5xx, para
// as páginas tratarem o feedback (sucesso/erro) sem precisar de try/catch
// espalhado por toda parte.

const API_BASE = '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    return { ok: false, status: 0, body: { error: 'network_error', message: networkErr.message } };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { ok: response.ok, status: response.status, body };
}

export function createTransaction(payload) {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTransaction(id) {
  return request(`/transactions/${encodeURIComponent(id)}`);
}

export function listTransactions(page, limit) {
  return request(`/transactions?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);
}

export function refundTransaction(id) {
  return request(`/transactions/${encodeURIComponent(id)}/refund`, {
    method: 'POST',
  });
}

export function getBalance() {
  return request('/balance');
}
