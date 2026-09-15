// Limite diário por cartão - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 7: cada cartão (card_last4) tem um limite diário de R$5.000,00 em
// transações aprovadas. A checagem em si (ler o total do dia) não é
// atômica sozinha - por isso o chamador (routes/transactions.js) deve
// envolver a leitura + a decisão + o insert num lock por card_last4
// (services/mutex.js), senão duas transações concorrentes do mesmo cartão
// podem "ver" o mesmo total e as duas passarem.

import { prisma } from '../db/client.js';

export const DAILY_LIMIT_CENTS = 500_000; // R$5.000,00

function startOfTodayUTC(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfTomorrowUTC(now = new Date()) {
  return new Date(startOfTodayUTC(now).getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Soma o total já aprovado HOJE (dia UTC) para um cartão.
 *
 * Usamos `total_with_interest` (valor com juros, o que de fato é lançado
 * no cartão nas parcelas) em vez de `amount_cents` (valor "de tabela" antes
 * de juros) - para compras 1x sem juros os dois valores são iguais.
 */
export async function getApprovedTotalToday(card_last4, now = new Date()) {
  const result = await prisma.transaction.aggregate({
    _sum: { total_with_interest: true },
    where: {
      card_last4,
      status: 'approved',
      created_at: {
        gte: startOfTodayUTC(now),
        lt: startOfTomorrowUTC(now),
      },
    },
  });

  return result._sum.total_with_interest ?? 0;
}

/**
 * true quando (total já aprovado hoje + nova transação) ultrapassa o
 * limite diário do cartão.
 */
export function exceedsDailyLimit(approvedTotalToday, newAmountCents) {
  return approvedTotalToday + newAmountCents > DAILY_LIMIT_CENTS;
}
