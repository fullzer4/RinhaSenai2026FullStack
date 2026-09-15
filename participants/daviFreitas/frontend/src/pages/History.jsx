// Histórico (/history) - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 9: lista paginada via query params (?page=&limit=), com deep link
// (acessar /history?page=3&limit=20 direto já mostra a página 3) usando
// useSearchParams do react-router-dom - a fonte de verdade da paginação é
// a própria URL, não um state local desacoplado dela.

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listTransactions, refundTransaction } from '../api.js';
import { formatCurrency, formatDate } from '../format.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
  const limit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refundingId, setRefundingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { ok, body } = await listTransactions(page, limit);
    setLoading(false);

    if (ok) {
      setTransactions(body.data);
      setPagination(body.pagination);
    } else {
      setError('Não foi possível carregar o histórico.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  function goToPage(nextPage) {
    setSearchParams({ page: String(nextPage), limit: String(limit) });
  }

  async function handleRefund(id) {
    setRefundingId(id);
    await refundTransaction(id);
    setRefundingId(null);
    load();
  }

  const isFirstPage = page <= 1;
  const isLastPage = pagination.total_pages === 0 || page >= pagination.total_pages;

  return (
    <div className="history">
      <h2>Histórico</h2>

      {error && <p className="feedback-error">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="list-transactions">
          {transactions.map((tx) => (
            <li className="transaction-item" key={tx.id}>
              <Link to={`/transaction/${tx.id}`} className="transaction-id" data-value={tx.id}>
                {tx.id}
              </Link>
              <span className="transaction-status" data-value={tx.status}>
                {tx.status}
              </span>
              <span className="transaction-amount" data-value={tx.amount_cents}>
                {formatCurrency(tx.amount_cents)}
              </span>
              <span className="transaction-brand" data-value={tx.card_brand}>
                {tx.card_brand}
              </span>
              <span className="transaction-installments" data-value={tx.installments}>
                {tx.installments}x
              </span>
              <span
                className="transaction-installment-amount"
                data-value={tx.installment_amount}
              >
                {formatCurrency(tx.installment_amount)}
              </span>
              <span className="transaction-total" data-value={tx.total_with_interest}>
                {formatCurrency(tx.total_with_interest)}
              </span>
              <span className="transaction-fee" data-value={tx.fee_cents}>
                {formatCurrency(tx.fee_cents)}
              </span>
              <span className="transaction-description">{tx.description}</span>
              <span className="transaction-card" data-value={tx.card_last4}>
                **** {tx.card_last4}
              </span>
              <span className="transaction-date" data-value={tx.created_at}>
                {formatDate(tx.created_at)}
              </span>
              <button
                className="btn-refund"
                type="button"
                disabled={tx.status !== 'approved' || refundingId === tx.id}
                onClick={() => handleRefund(tx.id)}
              >
                {refundingId === tx.id ? 'Estornando...' : 'Estornar'}
              </button>
            </li>
          ))}
          {transactions.length === 0 && <li>Nenhuma transação encontrada.</li>}
        </ul>
      )}

      <div className="pagination">
        <span className="pagination-current" data-value={pagination.page}>
          {pagination.page}
        </span>
        <span> / </span>
        <span className="pagination-pages" data-value={pagination.total_pages}>
          {pagination.total_pages}
        </span>
        <span className="pagination-total" data-value={pagination.total}>
          {' '}
          ({pagination.total} transações)
        </span>
        <button
          className="btn-prev-page"
          type="button"
          disabled={isFirstPage}
          onClick={() => goToPage(page - 1)}
        >
          Anterior
        </button>
        <button
          className="btn-next-page"
          type="button"
          disabled={isLastPage}
          onClick={() => goToPage(page + 1)}
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
