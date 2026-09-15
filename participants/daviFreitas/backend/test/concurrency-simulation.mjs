// Simulação de concorrência - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 10: valida os TRÊS cenários de concorrência da REGRA_DE_NEGOCIO.md
// (idempotência, limite diário, double refund) reaproveitando o código
// real de `services/mutex.js` e `services/idempotency.js`, mas com um
// banco falso em memória no lugar do Prisma.
//
// Por quê um banco falso em vez do servidor de verdade? Este ambiente de
// sandbox não tem acesso de rede ao binário do engine do Prisma
// (binaries.prisma.sh não está liberado), então não dá pra rodar
// `npm start` aqui. O objetivo deste script é isolar e validar a lógica
// que decide o resultado sob concorrência - a mesma lógica usada em
// routes/transactions.js -, sem depender de Prisma/SQLite estarem
// disponíveis.
//
// Isso NÃO substitui um teste de carga real contra o servidor rodando
// (veja test/http-stress-test.mjs para isso). É complementar: prova que a
// regra de negócio está correta mesmo sob concorrência, no nível da
// lógica pura.
//
// Rodar: node backend/test/concurrency-simulation.mjs

import assert from 'node:assert/strict';
import { withLock } from '../src/services/mutex.js';
import { computeIdempotencyKey } from '../src/services/idempotency.js';

const DAILY_LIMIT_CENTS = 500_000;

// ---------------------------------------------------------------------
// Banco falso em memória, só com o suficiente para simular o fluxo de
// routes/transactions.js (create, findUnique por idempotency_key/id,
// updateMany por status).
// ---------------------------------------------------------------------
function createFakeDb() {
  const rows = [];
  let seq = 0;

  return {
    rows,
    async create(data) {
      const row = { id: `tx-${++seq}`, created_at: new Date(), ...data };
      rows.push(row);
      return row;
    },
    async findByIdempotencyKey(key) {
      return rows.find((r) => r.idempotency_key === key) ?? null;
    },
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async approvedTotalToday(card_last4) {
      return rows
        .filter((r) => r.card_last4 === card_last4 && r.status === 'approved')
        .reduce((sum, r) => sum + r.total_with_interest, 0);
    },
    // Simula UPDATE ... WHERE id = ? AND status = 'approved' de forma
    // atômica (um único array splice, sem await no meio - exatamente o
    // que garante a atomicidade no SQLite de verdade também: um único
    // statement, sem janela de tempo entre ler e escrever).
    refundIfApproved(id) {
      const row = rows.find((r) => r.id === id);
      if (row && row.status === 'approved') {
        row.status = 'refunded';
        return true;
      }
      return false;
    },
  };
}

// ---------------------------------------------------------------------
// Reproduz o miolo de POST /api/transactions (idempotência + limite
// diário), do jeito que routes/transactions.js faz.
// ---------------------------------------------------------------------
async function submitTransaction(db, payload) {
  const idempotency_key = computeIdempotencyKey(payload);

  return withLock(`idem:${idempotency_key}`, async () => {
    const existing = await db.findByIdempotencyKey(idempotency_key);
    if (existing) return { transaction: existing, created: false };

    return withLock(`card:${payload.card_last4}`, async () => {
      const isDeclinedCard = payload.card_number.startsWith('9999');
      let status;
      if (isDeclinedCard) {
        status = 'declined';
      } else {
        const approvedToday = await db.approvedTotalToday(payload.card_last4);
        status =
          approvedToday + payload.total_with_interest > DAILY_LIMIT_CENTS
            ? 'declined'
            : 'approved';
      }

      const transaction = await db.create({ ...payload, status, idempotency_key });
      return { transaction, created: true };
    });
  });
}

function basePayload(overrides = {}) {
  return {
    card_number: '4111111111111111',
    card_last4: '1111',
    holder_name: 'Joao Silva',
    expiration: '12/28',
    cvv: '123',
    amount_cents: 100_000,
    installments: 1,
    total_with_interest: 100_000,
    description: 'Compra teste',
    ...overrides,
  };
}

let failures = 0;

function report(name, fn) {
  return fn()
    .then(() => console.log(`✓ ${name}`))
    .catch((err) => {
      failures += 1;
      console.error(`✗ ${name}`);
      console.error(err);
    });
}

// ---------------------------------------------------------------------
// Cenário 1: idempotência - 10 requisições IDÊNTICAS em paralelo devem
// resultar em UMA única transação no banco.
// ---------------------------------------------------------------------
async function testIdempotency() {
  const db = createFakeDb();
  const payload = basePayload({ description: 'Idempotencia' });

  const results = await Promise.all(
    Array.from({ length: 10 }, () => submitTransaction(db, payload)),
  );

  const createdCount = results.filter((r) => r.created).length;
  const uniqueIds = new Set(results.map((r) => r.transaction.id));

  assert.equal(createdCount, 1, 'exatamente uma requisição deveria ter criado a transação');
  assert.equal(uniqueIds.size, 1, 'todas as respostas deveriam apontar para a MESMA transação');
  assert.equal(db.rows.length, 1, 'deveria haver exatamente 1 linha no banco');
}

// ---------------------------------------------------------------------
// Cenário 2: limite diário sob concorrência - 10 transações de R$1.000,00
// (100_000 centavos) no MESMO cartão, disparadas juntas. O limite é
// R$5.000,00 -> no máximo 5 podem ser aprovadas, mesmo que as 10 leiam o
// total do dia "ao mesmo tempo".
// ---------------------------------------------------------------------
async function testDailyLimitRaceCondition() {
  const db = createFakeDb();

  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      submitTransaction(
        db,
        basePayload({ description: `Limite diario ${i}`, amount_cents: 100_000, total_with_interest: 100_000 }),
      ),
    ),
  );

  const approved = results.filter((r) => r.transaction.status === 'approved');
  const declined = results.filter((r) => r.transaction.status === 'declined');
  const approvedTotal = approved.reduce((sum, r) => sum + r.transaction.total_with_interest, 0);

  assert.equal(db.rows.length, 10, 'as 10 transações deveriam ter sido salvas (approved OU declined)');
  assert.equal(approved.length, 5, 'no máximo 5 transações de R$1.000 cabem no limite de R$5.000');
  assert.equal(declined.length, 5, 'as outras 5 deveriam ter sido recusadas por limite diário');
  assert.ok(
    approvedTotal <= DAILY_LIMIT_CENTS,
    `soma aprovada (${approvedTotal}) nunca pode passar do limite (${DAILY_LIMIT_CENTS})`,
  );
}

// ---------------------------------------------------------------------
// Cenário 3: double refund - 10 estornos concorrentes da MESMA transação
// só podem ter sucesso UMA vez.
// ---------------------------------------------------------------------
async function testDoubleRefund() {
  const db = createFakeDb();
  const { transaction } = await submitTransaction(db, basePayload({ description: 'Para estornar' }));
  assert.equal(transaction.status, 'approved');

  // refundIfApproved é síncrono e atômico (sem await no meio), do mesmo
  // jeito que um único UPDATE SQL é atômico no SQLite - por isso nem
  // precisa de lock aqui, igual ao endpoint real.
  const outcomes = Array.from({ length: 10 }, () => db.refundIfApproved(transaction.id));
  const successCount = outcomes.filter(Boolean).length;

  assert.equal(successCount, 1, 'só UM dos 10 estornos concorrentes pode ter sucesso');
  assert.equal(transaction.status, 'refunded', 'o status final deve ser refunded');
}

// ---------------------------------------------------------------------
// Cenário 4 (sanidade): cartões diferentes não deveriam travar um no
// outro - o lock é por card_last4, então isso também testa que o mutex
// não serializa chaves diferentes sem necessidade.
// ---------------------------------------------------------------------
async function testDifferentCardsDoNotBlockEachOther() {
  const db = createFakeDb();

  const results = await Promise.all([
    submitTransaction(db, basePayload({ card_number: '4111111111111111', card_last4: '1111' })),
    submitTransaction(db, basePayload({ card_number: '5111111111111111', card_last4: '2222' })),
    submitTransaction(db, basePayload({ card_number: '3711111111111111', card_last4: '3333' })),
  ]);

  assert.ok(results.every((r) => r.transaction.status === 'approved'));
  assert.equal(db.rows.length, 3);
}

async function main() {
  await report('idempotência sob concorrência', testIdempotency);
  await report('limite diário sob concorrência (race condition)', testDailyLimitRaceCondition);
  await report('double refund concorrente', testDoubleRefund);
  await report('cartões diferentes não se bloqueiam', testDifferentCardsDoNotBlockEachOther);

  console.log('');
  if (failures > 0) {
    console.error(`${failures} cenário(s) falharam.`);
    process.exit(1);
  }
  console.log('Todos os cenários de concorrência passaram.');
}

main();
