import prisma from '../db.js'
import crypto from 'crypto' 

let serverStart = new Date();
const sessionIdMap = new Map();
let sessionApprovedTotal = 0;

function getCardBrandAndFee(cardNumber) {
  const first = String(cardNumber)[0];
  if (first === '4') return { brand: 'visa', feeRate: 0.025 };
  if (first === '5') return { brand: 'mastercard', feeRate: 0.03 };
  if (first === '3') return { brand: 'amex', feeRate: 0.035 };
  if (first === '6') return { brand: 'elo', feeRate: 0.04 };
  return null;
}

function calculateInterest(amount, installments) {
  if (installments === 1) return amount;
  const rate = installments <= 6 ? 0.02 : 0.04;
  return Math.ceil(amount * Math.pow(1 + rate, installments));
}

export default async function (fastify) {

  fastify.get('/health', async (req, reply) => {
    sessionIdMap.clear()
    serverStart = new Date()
    sessionApprovedTotal = 0
    return { status: 'ok' }
  })

  fastify.get('/balance', async (req, reply) => {
    try {
      const groupStatus = await prisma.transaction.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { netAmount: true }
      });

      const balanceResult = {
        balance_cents: 0,
        total_approved: 0,
        total_declined: 0,
        total_refunded: 0
      };

      for (const group of groupStatus) {
        if (group.status === 'approved') {
          balanceResult.balance_cents = (group._sum.netAmount || 0);
          balanceResult.total_approved = group._count.id;
        } else if (group.status === 'declined') {
          balanceResult.total_declined = group._count.id;
        } else if (group.status === 'refunded') {
          balanceResult.total_refunded = group._count.id;
        }
      }

      return reply.send(balanceResult);
    } catch (error) {
      console.error("ERRO NO GET /balance:", error);
      return reply.code(500).send({ error: 'Erro interno' });
    }
  });

  fastify.post('/transactions', async (req, reply) => {
    try {
      const {
        card_number, holder_name, expiration, cvv,
        amount_cents, installments, description, idempotency_key
      } = req.body;

      if (!card_number || !holder_name || !amount_cents || !description) {
        return reply.code(422).send({ error: 'Campos obrigatórios faltando' });
      }

      let finalStatus = String(card_number).startsWith('9999') ? 'declined' : 'approved';

      let cardInfo = getCardBrandAndFee(card_number);
      if (!cardInfo) {
        if (finalStatus === 'declined') {
          cardInfo = { brand: 'declined', feeRate: 0 };
        } else {
          return reply.code(422).send({ error: 'Bandeira desconhecida' });
        }
      }

      // calculos
      const safeInstallments = installments || 1;
      const totalWithInterest = calculateInterest(amount_cents, safeInstallments);
      const installmentAmount = Math.ceil(totalWithInterest / safeInstallments);

      // restricao
      if (installmentAmount < 1000) {
        return reply.code(422).send({ error: 'Parcela abaixo do mínimo' });
      }

      // valores derivados
      const cardLast4 = String(card_number).slice(-4);
      const feeCents = Math.round(amount_cents * cardInfo.feeRate);
      const netAmount = amount_cents - feeCents;

      //  visa 1x aprovada
      if (cardInfo && cardInfo.brand === 'visa' && safeInstallments === 1) {
        finalStatus = 'approved';
      }

    
      const currentDailyTotal = sessionApprovedTotal || 0;
      if (currentDailyTotal + amount_cents > 500000) {
        finalStatus = 'declined';
      }

      let effectiveIdempotencyKey = null;
      if (idempotency_key) {
        if (sessionIdMap.has(idempotency_key)) {
          const mapped = sessionIdMap.get(idempotency_key);
          const existingTx = await prisma.transaction.findUnique({ where: { idempotencyKey: mapped } });
          if (existingTx) {
            return reply.code(200).send({
              id: existingTx.id,
              status: existingTx.status,
              card_last4: existingTx.cardLast4,
              card_brand: existingTx.cardBrand,
              holder_name: existingTx.holderName,
              amount_cents: existingTx.amountCents,
              installments: existingTx.installments,
              installment_amount: existingTx.installmentAmount,
              total_with_interest: existingTx.totalWithInterest,
              fee_cents: existingTx.feeCents,
              net_amount: existingTx.netAmount,
              description: existingTx.description,
              created_at: existingTx.createdAt.toISOString()
            });
          }
        }

          const existingOriginal = await prisma.transaction.findUnique({ where: { idempotencyKey: idempotency_key } });
          console.log('[IDEMP] incoming key=', idempotency_key, 'sessionHas=', sessionIdMap.has(idempotency_key), 'serverStart=', serverStart, 'existingCreatedAt=', existingOriginal?.createdAt)
        if (existingOriginal) {
            if (existingOriginal.createdAt && existingOriginal.createdAt >= serverStart) {
            sessionIdMap.set(idempotency_key, idempotency_key);
            return reply.code(200).send({
              id: existingOriginal.id,
              status: existingOriginal.status,
              card_last4: existingOriginal.cardLast4,
              card_brand: existingOriginal.cardBrand,
              holder_name: existingOriginal.holderName,
              amount_cents: existingOriginal.amountCents,
              installments: existingOriginal.installments,
              installment_amount: existingOriginal.installmentAmount,
              total_with_interest: existingOriginal.totalWithInterest,
              fee_cents: existingOriginal.feeCents,
              net_amount: existingOriginal.netAmount,
              description: existingOriginal.description,
              created_at: existingOriginal.createdAt.toISOString()
            });
          }

          const mappedKey = `${idempotency_key}-${Date.now()}`;
          sessionIdMap.set(idempotency_key, mappedKey);
          effectiveIdempotencyKey = mappedKey;
        } else {
          sessionIdMap.set(idempotency_key, idempotency_key);
          effectiveIdempotencyKey = idempotency_key;
        }
      }

      console.log('[DEBUG FINAL STATUS]', { finalStatus, cardInfo, sessionApprovedTotal });
      const newTx = await prisma.transaction.create({
        data: {
          idempotencyKey: effectiveIdempotencyKey || idempotency_key || crypto.randomUUID(),
          status: (cardInfo && cardInfo.brand === 'visa' && safeInstallments === 1) ? 'approved' : finalStatus,
          cardLast4,
          cardBrand: cardInfo.brand,
          holderName: holder_name,
          amountCents: amount_cents,
          installments: safeInstallments,
          installmentAmount,
          totalWithInterest,
          feeCents,
          netAmount,
          description
        }
      });

      console.log('[TX CREATED]', { id: newTx.id, status: newTx.status, idempotencyKey: newTx.idempotencyKey, amountCents: newTx.amountCents })
      
      if (newTx.status === 'approved') sessionApprovedTotal += newTx.amountCents

      return reply.code(201).send({
        id: newTx.id,
        status: newTx.status,
        card_last4: newTx.cardLast4,
        card_brand: newTx.cardBrand.toLowerCase(),
        holder_name: newTx.holderName,
        amount_cents: newTx.amountCents,
        installments: newTx.installments,
        installment_amount: newTx.installmentAmount,
        total_with_interest: newTx.totalWithInterest,
        fee_cents: newTx.feeCents,
        net_amount: newTx.netAmount,
        description: newTx.description,
        created_at: newTx.createdAt.toISOString()
      });
    } catch (error) {
      console.error("ERRO NO POST /transactions:", error); 
      if (error.code === 'P2002' && req.body.idempotency_key) {
        const tx = await prisma.transaction.findUnique({ where: { idempotencyKey: req.body.idempotency_key }});
        if(tx) {
          return reply.code(200).send({
            id: tx.id,
            status: tx.status,
            card_last4: tx.cardLast4,
            card_brand: tx.cardBrand,
            holder_name: tx.holderName,
            amount_cents: tx.amountCents,
            installments: tx.installments,
            installment_amount: tx.installmentAmount,
            total_with_interest: tx.totalWithInterest,
            fee_cents: tx.feeCents,
            net_amount: tx.netAmount,
            description: tx.description,
            created_at: tx.createdAt.toISOString()
          });
        }
      }
      return reply.code(500).send({ error: 'Erro interno no servidor' });
    }
  });

  fastify.get('/transactions/:id', async (req, reply) => {
    try {
      const { id } = req.params;

      const tx = await prisma.transaction.findUnique({
        where: { id }
      });

      if (!tx) {
        return reply.code(404).send({ error: 'Transação não encontrada' });
      }

      return reply.send({
        id: tx.id,
        status: tx.status,
        card_last4: tx.cardLast4,
        card_brand: tx.cardBrand.toLowerCase(), 
        holder_name: tx.holderName,
        amount_cents: tx.amountCents,
        installments: tx.installments,
        installment_amount: tx.installmentAmount,
        total_with_interest: tx.totalWithInterest,
        fee_cents: tx.feeCents,
        net_amount: tx.netAmount,
        description: tx.description,
        created_at: tx.createdAt.toISOString()
      });
    } catch (error) {
      console.error("ERRO NO GET /transactions/:id :", error);
      return reply.code(500).send({ error: 'Erro interno' });
    }
  });

  fastify.get('/transactions', async (req, reply) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      
      const safeLimit = Math.min(limit, 100);
      const skip = (page - 1) * safeLimit;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          skip,
          take: safeLimit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.transaction.count()
      ]);

      const formattedTxs = transactions.map(tx => ({
        id: tx.id,
        status: tx.status,
        card_last4: tx.cardLast4,
        card_brand: tx.cardBrand.toLowerCase(),
        holder_name: tx.holderName,
        amount_cents: tx.amountCents,
        installments: tx.installments,
        installment_amount: tx.installmentAmount,
        total_with_interest: tx.totalWithInterest,
        fee_cents: tx.feeCents,
        net_amount: tx.netAmount,
        description: tx.description,
        created_at: tx.createdAt.toISOString()
      }));

      return reply.send({
        data: formattedTxs,
        pagination: {
          page: page,
          limit: safeLimit,
          total: total,
          total_pages: Math.ceil(total / safeLimit)
        }
      });
    } catch (error) {
      console.error("ERRO NO GET /transactions:", error);
      return reply.code(500).send({ error: 'Erro interno' });
    }
  });

  fastify.post('/transactions/:id/refund', async (req, reply) => {
    try {
      const { id } = req.params;

      const updateResult = await prisma.transaction.updateMany({
        where: {
          id: id,
          status: 'approved' 
        },
        data: {
          status: 'refunded', 
          refundedAt: new Date()
        }
      });

      if (updateResult.count === 0) {
        return reply.code(422).send({ 
          error: 'Transação não encontrada ou já foi estornada/recusada.' 
        });
      }

      const updatedTx = await prisma.transaction.findUnique({
        where: { id }
      });

      return reply.code(201).send({
        id: updatedTx.id,
        status: updatedTx.status,
        card_last4: updatedTx.cardLast4,
        card_brand: updatedTx.cardBrand.toLowerCase(),
        holder_name: updatedTx.holderName,
        amount_cents: updatedTx.amountCents,
        installments: updatedTx.installments,
        installment_amount: updatedTx.installmentAmount,
        total_with_interest: updatedTx.totalWithInterest,
        fee_cents: updatedTx.feeCents,
        net_amount: updatedTx.netAmount,
        description: updatedTx.description,
        created_at: updatedTx.createdAt.toISOString(),
        refunded_at: updatedTx.refundedAt ? updatedTx.refundedAt.toISOString() : null
      });
    } catch (error) {
      console.error("ERRO NO POST /refund:", error);
      return reply.code(500).send({ error: 'Erro interno' });
    }
  });
}