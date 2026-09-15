// Dashboard (/) - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 9: formulário de pagamento + saldo. Classes CSS exatamente como
// especificado na REGRA_DE_NEGOCIO.md, já que o benchmark de frontend
// localiza os elementos por elas via Playwright.

import { useCallback, useEffect, useState } from 'react';
import { createTransaction, getBalance } from '../api.js';
import { formatCurrency } from '../format.js';

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const EMPTY_FORM = {
  card_number: '',
  holder_name: '',
  expiration: '',
  cvv: '',
  amount_cents: '',
  installments: 1,
  description: '',
};

function buildErrorMessage(status, body) {
  if (status === 422 && Array.isArray(body?.fields) && body.fields.length > 0) {
    return body.fields.map((field) => field.message).join(' | ');
  }
  return body?.message || 'Não foi possível processar a transação.';
}

export default function Dashboard() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [balance, setBalance] = useState(null);

  const loadBalance = useCallback(async () => {
    const { ok, body } = await getBalance();
    if (ok) setBalance(body);
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  function updateField(field) {
    return (event) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      card_number: form.card_number.trim(),
      holder_name: form.holder_name.trim(),
      expiration: form.expiration.trim(),
      cvv: form.cvv.trim(),
      amount_cents: Number(form.amount_cents),
      installments: Number(form.installments),
      description: form.description.trim(),
    };

    const { ok, status, body } = await createTransaction(payload);
    setSubmitting(false);

    if (ok && body?.status === 'approved') {
      setFeedback({
        type: 'success',
        message: `Pagamento aprovado! Valor líquido: ${formatCurrency(body.net_amount)}`,
      });
      setForm(EMPTY_FORM);
      loadBalance();
      return;
    }

    if (ok && body?.status === 'declined') {
      setFeedback({
        type: 'error',
        message: 'Pagamento recusado pelo cartão (declined).',
      });
      setForm(EMPTY_FORM);
      loadBalance();
      return;
    }

    setFeedback({ type: 'error', message: buildErrorMessage(status, body) });
  }

  return (
    <div className="dashboard">
      <section className="balance-panel">
        <h2>Saldo</h2>
        <p>
          <span className="display-balance" data-value={balance?.balance_cents ?? 0}>
            {formatCurrency(balance?.balance_cents ?? 0)}
          </span>
        </p>
        <ul className="balance-stats">
          <li>
            Aprovadas:{' '}
            <span className="display-total-approved" data-value={balance?.total_approved ?? 0}>
              {balance?.total_approved ?? 0}
            </span>
          </li>
          <li>
            Recusadas:{' '}
            <span className="display-total-declined" data-value={balance?.total_declined ?? 0}>
              {balance?.total_declined ?? 0}
            </span>
          </li>
          <li>
            Estornadas:{' '}
            <span className="display-total-refunded" data-value={balance?.total_refunded ?? 0}>
              {balance?.total_refunded ?? 0}
            </span>
          </li>
        </ul>
      </section>

      <form className="payment-form" onSubmit={handleSubmit}>
        <h2>Novo pagamento</h2>

        <label>
          Número do cartão
          <input
            className="input-card-number"
            type="text"
            inputMode="numeric"
            maxLength={16}
            placeholder="4111111111111111"
            value={form.card_number}
            onChange={updateField('card_number')}
            required
          />
        </label>

        <label>
          Nome do titular
          <input
            className="input-holder-name"
            type="text"
            maxLength={50}
            placeholder="Nome como está no cartão"
            value={form.holder_name}
            onChange={updateField('holder_name')}
            required
          />
        </label>

        <label>
          Validade
          <input
            className="input-expiration"
            type="text"
            placeholder="MM/YY"
            maxLength={5}
            value={form.expiration}
            onChange={updateField('expiration')}
            required
          />
        </label>

        <label>
          CVV
          <input
            className="input-cvv"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.cvv}
            onChange={updateField('cvv')}
            required
          />
        </label>

        <label>
          Valor (centavos)
          <input
            className="input-amount"
            type="number"
            min="1"
            step="1"
            placeholder="15000"
            value={form.amount_cents}
            onChange={updateField('amount_cents')}
            required
          />
        </label>

        <label>
          Parcelas
          <select
            className="select-installments"
            value={form.installments}
            onChange={updateField('installments')}
          >
            {INSTALLMENT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </select>
        </label>

        <label>
          Descrição
          <input
            className="input-description"
            type="text"
            maxLength={100}
            value={form.description}
            onChange={updateField('description')}
            required
          />
        </label>

        <button className="btn-pay" type="submit" disabled={submitting}>
          {submitting ? 'Processando...' : 'Pagar'}
        </button>

        {feedback?.type === 'success' && <p className="feedback-success">{feedback.message}</p>}
        {feedback?.type === 'error' && <p className="feedback-error">{feedback.message}</p>}
      </form>
    </div>
  );
}
