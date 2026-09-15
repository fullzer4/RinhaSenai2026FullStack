// Detalhe (/transaction/:id) - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 9: mostra os campos da transação e o botão de estorno, visível só
// quando o status atual é `approved` (conforme a REGRA_DE_NEGOCIO.md, ao
// contrário da tela de Histórico onde o botão fica sempre presente, só
// desabilitado).

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTransaction, refundTransaction } from '../api.js';
import { formatCurrency, formatDate } from '../format.js';

export default function TransactionDetail() {
  const { id } = useParams();

  const [transaction, setTransaction] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    const { ok, status, body } = await getTransaction(id);
    setLoading(false);

    if (ok) {
      setTransaction(body);
    } else if (status === 404) {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefund() {
    setRefunding(true);
    setFeedback(null);
    const { ok, body } = await refundTransaction(id);
    setRefunding(false);

    if (ok) {
      setTransaction(body);
      setFeedback({ type: 'success', message: 'Transação estornada com sucesso.' });
    } else {
      setFeedback({ type: 'error', message: body?.message || 'Não foi possível estornar.' });
    }
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (notFound || !transaction) {
    return (
      <div className="transaction-detail">
        <p className="feedback-error">Transação não encontrada.</p>
        <Link to="/history">Voltar ao histórico</Link>
      </div>
    );
  }

  return (
    <div className="transaction-detail">
      <h2>Detalhe da transação</h2>

      <dl>
        <dt>ID</dt>
        <dd className="detail-id" data-value={transaction.id}>
          {transaction.id}
        </dd>

        <dt>Status</dt>
        <dd className="detail-status" data-value={transaction.status}>
          {transaction.status}
        </dd>

        <dt>Valor</dt>
        <dd className="detail-amount" data-value={transaction.amount_cents}>
          {formatCurrency(transaction.amount_cents)}
        </dd>

        <dt>Bandeira</dt>
        <dd className="detail-brand">{transaction.card_brand}</dd>

        <dt>Titular</dt>
        <dd className="detail-holder">{transaction.holder_name}</dd>

        <dt>Cartão</dt>
        <dd className="detail-card" data-value={transaction.card_last4}>
          **** {transaction.card_last4}
        </dd>

        <dt>Parcelas</dt>
        <dd className="detail-installments" data-value={transaction.installments}>
          {transaction.installments}x
        </dd>

        <dt>Valor da parcela</dt>
        <dd className="detail-installment-amount" data-value={transaction.installment_amount}>
          {formatCurrency(transaction.installment_amount)}
        </dd>

        <dt>Total com juros</dt>
        <dd className="detail-total" data-value={transaction.total_with_interest}>
          {formatCurrency(transaction.total_with_interest)}
        </dd>

        <dt>Taxa</dt>
        <dd className="detail-fee" data-value={transaction.fee_cents}>
          {formatCurrency(transaction.fee_cents)}
        </dd>

        <dt>Valor líquido</dt>
        <dd className="detail-net" data-value={transaction.net_amount}>
          {formatCurrency(transaction.net_amount)}
        </dd>

        <dt>Descrição</dt>
        <dd className="detail-description">{transaction.description}</dd>

        <dt>Data</dt>
        <dd className="detail-date" data-value={transaction.created_at}>
          {formatDate(transaction.created_at)}
        </dd>
      </dl>

      {transaction.status === 'approved' && (
        <button className="btn-refund" type="button" onClick={handleRefund} disabled={refunding}>
          {refunding ? 'Estornando...' : 'Estornar'}
        </button>
      )}

      {feedback?.type === 'success' && <p className="feedback-success">{feedback.message}</p>}
      {feedback?.type === 'error' && <p className="feedback-error">{feedback.message}</p>}

      <p>
        <Link to="/history">Voltar ao histórico</Link>
      </p>
    </div>
  );
}
