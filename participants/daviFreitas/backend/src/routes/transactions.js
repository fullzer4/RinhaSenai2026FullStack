// Rotas de transações - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 7: adiciona ao POST /api/transactions da Etapa 6 duas coisas
// concorrentes-sensíveis:
//
//   1. Limite diário por cartão (card_last4): a soma do dia + a nova
//      transação não pode ultrapassar R$5.000,00. Quando ultrapassa, a
//      transação é salva como `declined` (não é HTTP 422 - ela é
//      efetivamente "recusada pelo cartão", igual ao caso do prefixo
//      9999, conforme a tabela de Status da REGRA_DE_NEGOCIO.md).
//   2. Idempotência: requisições com o mesmo conteúdo, enviadas em
//      paralelo, não podem gerar transações duplicadas. Em vez de exigir
//      um header de idempotência, derivamos a chave do próprio corpo da
//      requisição (services/idempotency.js).
//
// A atomicidade das duas checagens vem de um lock em memória por chave
// (services/mutex.js): idempotency_key primeiro, depois card_last4. Como a
// aplicação roda como processo único, isso é suficiente para eliminar as
// race conditions descritas na REGRA_DE_NEGOCIO.md. Como segunda linha de
// defesa (ex.: mais de um processo do servidor), a coluna idempotency_key
// tem constraint unique no banco.

import { prisma } from '../db/client.js';
import {
  validateTransactionInput,
  formatValidationErrors,
} from '../validators/transaction.js';
import { calculateTransaction } from '../services/calculations.js';
import { withLock } from '../services/mutex.js';
import { computeIdempotencyKey } from '../services/idempotency.js';
import { getApprovedTotalToday, exceedsDailyLimit } from '../services/daily-limit.js';

const DECLINED_CARD_PREFIX = '9999';
const IDEMPOTENCY_LOCK_PREFIX = 'idem:';
const CARD_LOCK_PREFIX = 'card:';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

// Etapa 8: paginação de GET /api/transactions
const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 100;

/**
 * Monta o payload de resposta no formato exato da REGRA_DE_NEGOCIO.md.
 */
function serializeTransaction(transaction) {
  return {
    id: transaction.id,
    status: transaction.status,
    card_last4: transaction.card_last4,
    card_brand: transaction.card_brand,
    holder_name: transaction.holder_name,
    amount_cents: transaction.amount_cents,
    installments: transaction.installments,
    installment_amount: transaction.installment_amount,
    total_with_interest: transaction.total_with_interest,
    fee_cents: transaction.fee_cents,
    net_amount: transaction.net_amount,
    description: transaction.description,
    created_at: transaction.created_at,
  };
}

/**
 * Interpreta `page` e `limit` da querystring (Etapa 8).
 *
 * Regras: `page` default 1, `limit` default 10, `limit` máximo 100. Valores
 * ausentes, não numéricos, ou fora da faixa (<=0, ou > máximo) caem de
 * volta no default/limite em vez de gerar erro - mantém a rota de listagem
 * sempre "best effort" e evitou inventar um contrato de erro que a
 * REGRA_DE_NEGOCIO.md não especifica para este endpoint.
 */
function parsePagination(query) {
  const rawPage = Number(query?.page);
  const rawLimit = Number(query?.limit);

  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? rawPage : PAGE_DEFAULT;

  let limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : LIMIT_DEFAULT;
  limit = Math.min(limit, LIMIT_MAX);

  return { page, limit };
}

function notFoundResponse() {
  return {
    error: 'not_found',
    message: 'Transação não encontrada',
  };
}

/**
 * Decide o status (approved/declined) e grava a transação. Deve rodar
 * dentro do lock por card_last4: a leitura do total aprovado hoje e o
 * insert precisam ser atômicos em relação a outras transações do MESMO
 * cartão, senão duas requisições concorrentes podem ler o mesmo total e
 * as duas passarem no limite.
 */
async function decideStatusAndCreate({
  card_number,
  card_last4,
  card_brand,
  holder_name,
  amount_cents,
  installments,
  installment_amount,
  total_with_interest,
  fee_cents,
  net_amount,
  description,
  idempotency_key,
}) {
  const isDeclinedCard = card_number.startsWith(DECLINED_CARD_PREFIX);

  let status;
  if (isDeclinedCard) {
    status = 'declined';
  } else {
    const approvedToday = await getApprovedTotalToday(card_last4);
    status = exceedsDailyLimit(approvedToday, total_with_interest) ? 'declined' : 'approved';
  }

  try {
    const created = await prisma.transaction.create({
      data: {
        status,
        card_last4,
        card_brand,
        holder_name,
        amount_cents,
        installments,
        installment_amount,
        total_with_interest,
        fee_cents,
        net_amount,
        description,
        idempotency_key,
      },
    });
    return { transaction: created, created: true };
  } catch (err) {
    // Corrida rara (ex.: mais de um processo do servidor): outra requisição
    // já inseriu com a mesma idempotency_key entre a checagem e o insert.
    // O lock em memória cobre concorrência dentro do mesmo processo; isso
    // aqui é só a rede de segurança do banco.
    if (err?.code === PRISMA_UNIQUE_CONSTRAINT_ERROR) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotency_key },
      });
      if (existing) {
        return { transaction: existing, created: false };
      }
    }
    throw err;
  }
}

export default async function transactionsRoutes(app) {
  app.post('/transactions', async (request, reply) => {
    const { valid, errors, data } = validateTransactionInput(request.body);

    if (!valid) {
      return reply.code(422).send(formatValidationErrors(errors));
    }

    const {
      card_number,
      holder_name,
      amount_cents,
      installments,
      description,
    } = data;

    const calc = calculateTransaction({ amount_cents, installments, card_number });

    if (calc.error === 'unknown_brand') {
      return reply.code(422).send(
        formatValidationErrors([
          { field: 'card_number', message: 'Bandeira do cartão não reconhecida' },
        ]),
      );
    }

    if (calc.error === 'installment_below_minimum') {
      return reply.code(422).send(
        formatValidationErrors([
          {
            field: 'installments',
            message: 'Valor da parcela abaixo do mínimo permitido (R$10,00)',
          },
        ]),
      );
    }

    const card_last4 = card_number.slice(-4);
    const {
      card_brand,
      total_with_interest,
      installment_amount,
      fee_cents,
      net_amount,
    } = calc;

    const idempotency_key = computeIdempotencyKey(data);

    // Lock 1: por idempotency_key. Se duas requisições idênticas chegarem
    // juntas, a segunda só roda depois que a primeira já tiver terminado
    // (gravado ou falhado) - e aí encontra a transação já existente em vez
    // de criar outra.
    const { transaction, created } = await withLock(
      `${IDEMPOTENCY_LOCK_PREFIX}${idempotency_key}`,
      async () => {
        const existing = await prisma.transaction.findUnique({
          where: { idempotency_key },
        });
        if (existing) {
          return { transaction: existing, created: false };
        }

        // Lock 2: por cartão, para a checagem atômica do limite diário.
        return withLock(`${CARD_LOCK_PREFIX}${card_last4}`, () =>
          decideStatusAndCreate({
            card_number,
            card_last4,
            card_brand,
            holder_name,
            amount_cents,
            installments,
            installment_amount,
            total_with_interest,
            fee_cents,
            net_amount,
            description,
            idempotency_key,
          }),
        );
      },
    );

    // 201 quando a transação foi criada agora; 200 quando era uma
    // repetição idêntica de uma requisição já processada (idempotência).
    return reply.code(created ? 201 : 200).send(serializeTransaction(transaction));
  });

  // Etapa 8: consulta por ID.
  app.get('/transactions/:id', async (request, reply) => {
    const { id } = request.params;

    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return reply.code(404).send(notFoundResponse());
    }

    return reply.code(200).send(serializeTransaction(transaction));
  });

  // Etapa 8: listagem paginada, mais recentes primeiro.
  app.get('/transactions', async (request, reply) => {
    const { page, limit } = parsePagination(request.query);

    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count(),
    ]);

    return reply.code(200).send({
      data: rows.map(serializeTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  });

  // Etapa 9: estorno.
  //
  // O UPDATE abaixo já sai com a condição `WHERE id = ? AND status =
  // 'approved'` embutida (via prisma.updateMany + where). Isso é atômico
  // no nível do próprio SQLite: se duas requisições de estorno da MESMA
  // transação chegarem juntas, o motor do banco serializa as duas escritas
  // e só a primeira encontra `status = 'approved'` para casar com o WHERE
  // - a segunda encontra 0 linhas afetadas (o status já mudou), sem
  // precisar de lock em memória.
  app.post('/transactions/:id/refund', async (request, reply) => {
    const { id } = request.params;

    const result = await prisma.transaction.updateMany({
      where: { id, status: 'approved' },
      data: { status: 'refunded' },
    });

    if (result.count === 0) {
      const existing = await prisma.transaction.findUnique({ where: { id } });

      if (!existing) {
        return reply.code(404).send(notFoundResponse());
      }

      return reply.code(422).send({
        error: 'invalid_refund',
        message: `Transação não pode ser estornada (status atual: ${existing.status})`,
      });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    return reply.code(200).send(serializeTransaction(transaction));
  });
}
