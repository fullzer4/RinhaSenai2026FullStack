// Rota de saldo - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 8: GET /api/balance.
//
// balance_cents é o saldo líquido "vivo": soma de net_amount só das
// transações com status atual `approved`. Transações `declined` nunca
// contam (nem aqui, nem no limite diário). Transações `refunded` também
// não entram na soma - o estorno devolve o dinheiro, então o saldo delas
// já não deve mais aparecer (e como o status muda de approved -> refunded
// no mesmo registro, isso cai de graça no filtro por status).
//
// total_approved / total_declined / total_refunded são contagens pelo
// status ATUAL de cada transação (uma transação estornada conta em
// total_refunded, não mais em total_approved).

import { prisma } from '../db/client.js';

export default async function balanceRoutes(app) {
  app.get('/balance', async (request, reply) => {
    const [approvedAgg, totalApproved, totalDeclined, totalRefunded] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { net_amount: true },
        where: { status: 'approved' },
      }),
      prisma.transaction.count({ where: { status: 'approved' } }),
      prisma.transaction.count({ where: { status: 'declined' } }),
      prisma.transaction.count({ where: { status: 'refunded' } }),
    ]);

    return reply.code(200).send({
      balance_cents: approvedAgg._sum.net_amount ?? 0,
      total_approved: totalApproved,
      total_declined: totalDeclined,
      total_refunded: totalRefunded,
    });
  });
}
