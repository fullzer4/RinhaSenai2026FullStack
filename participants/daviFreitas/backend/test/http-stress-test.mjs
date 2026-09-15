// Teste de carga HTTP - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 10: roda contra o servidor de verdade (precisa estar no ar via
// `npm start` na raiz do time). Usa só `fetch` nativo do Node, sem
// dependências novas. Cobre os mesmos 3 cenários da simulação em
// concurrency-simulation.mjs, mas agora fim-a-fim: HTTP -> Fastify ->
// Prisma -> SQLite.
//
// Uso:
//   node backend/test/http-stress-test.mjs [base_url]
//
// Exemplo:
//   npm start                                   # em um terminal
//   node backend/test/http-stress-test.mjs       # em outro

const BASE_URL = process.argv[2] || 'http://localhost:3000';

let failures = 0;

function check(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
  } else {
    failures += 1;
    console.error(`✗ ${message}`);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // resposta sem corpo JSON
  }
  return { status: res.status, body: json };
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const json = await res.json();
  return { status: res.status, body: json };
}

function uniqueCard(prefix = '4') {
  // 15 dígitos aleatórios + o prefixo da bandeira = 16 dígitos.
  const rest = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${rest}`;
}

// ---------------------------------------------------------------------
// health check antes de tudo
// ---------------------------------------------------------------------
async function ensureServerIsUp() {
  try {
    const { status, body } = await get('/api/health');
    check(status === 200 && body?.status === 'ok', 'GET /api/health responde 200 { status: "ok" }');
  } catch (err) {
    console.error(`Não consegui conectar em ${BASE_URL}. O servidor está rodando (npm start)?`);
    console.error(err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------
// Cenário 1: idempotência - mesma requisição, 10x em paralelo
// ---------------------------------------------------------------------
async function testIdempotency() {
  const payload = {
    card_number: uniqueCard('4'),
    holder_name: 'Teste Idempotencia',
    expiration: '12/30',
    cvv: '123',
    amount_cents: 20000,
    installments: 1,
    description: 'stress-test idempotencia',
  };

  const results = await Promise.all(Array.from({ length: 10 }, () => post('/api/transactions', payload)));

  const ids = new Set(results.map((r) => r.body?.id).filter(Boolean));
  check(ids.size === 1, `idempotência: 10 requisições idênticas concorrentes geraram ${ids.size} id(s) distinto(s) (esperado 1)`);

  // confere no histórico que só existe 1 transação com essa descrição
  const { body: list } = await get('/api/transactions?page=1&limit=100');
  const matching = list.data.filter((t) => t.description === payload.description);
  check(matching.length === 1, `histórico contém ${matching.length} transação(ões) com a descrição de teste (esperado 1)`);
}

// ---------------------------------------------------------------------
// Cenário 2: limite diário - várias transações do MESMO cartão em
// paralelo, valor por transação escolhido para caber exatamente 5x no
// limite de R$5.000,00.
// ---------------------------------------------------------------------
async function testDailyLimit() {
  const card_number = uniqueCard('4');
  const amount_cents = 100000; // R$1.000,00 x 10 tentativas, limite cabe 5

  const requests = Array.from({ length: 10 }, (_, i) => ({
    card_number,
    holder_name: 'Teste Limite Diario',
    expiration: '12/30',
    cvv: '123',
    amount_cents,
    installments: 1,
    description: `stress-test limite diario ${i}-${Math.random()}`,
  }));

  const results = await Promise.all(requests.map((body) => post('/api/transactions', body)));

  const approved = results.filter((r) => r.body?.status === 'approved');
  const declined = results.filter((r) => r.body?.status === 'declined');

  check(approved.length + declined.length === 10, 'todas as 10 transações do cartão foram criadas (approved ou declined)');
  check(approved.length === 5, `${approved.length}/10 transações aprovadas (esperado exatamente 5, já que 5 x R$1.000 = R$5.000)`);

  const approvedTotal = approved.reduce((sum, r) => sum + r.body.total_with_interest, 0);
  check(approvedTotal <= 500000, `soma aprovada no cartão (${approvedTotal} centavos) não ultrapassa o limite de 500000`);
}

// ---------------------------------------------------------------------
// Cenário 3: double refund - a mesma transação, estornada 10x em
// paralelo, só pode ter sucesso 1 vez.
// ---------------------------------------------------------------------
async function testDoubleRefund() {
  const { status: createStatus, body: created } = await post('/api/transactions', {
    card_number: uniqueCard('5'),
    holder_name: 'Teste Double Refund',
    expiration: '12/30',
    cvv: '321',
    amount_cents: 30000,
    installments: 1,
    description: `stress-test double refund ${Math.random()}`,
  });

  check(createStatus === 201 && created?.status === 'approved', 'transação de teste para o refund foi criada como approved');

  const refunds = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/api/transactions/${created.id}/refund`, { method: 'POST' }).then((r) => r.status),
    ),
  );

  const successCount = refunds.filter((status) => status === 200).length;
  check(successCount === 1, `${successCount}/10 chamadas de estorno concorrentes tiveram sucesso (esperado exatamente 1)`);

  const { body: final } = await get(`/api/transactions/${created.id}`);
  check(final.status === 'refunded', 'status final da transação é refunded');
}

async function main() {
  console.log(`Rodando stress test contra ${BASE_URL}\n`);

  await ensureServerIsUp();
  await testIdempotency();
  await testDailyLimit();
  await testDoubleRefund();

  console.log('');
  if (failures > 0) {
    console.error(`${failures} verificação(ões) falharam.`);
    process.exit(1);
  }
  console.log('Todas as verificações de concorrência passaram contra o servidor real.');
}

main();
