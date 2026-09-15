// Mutex simples por chave - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 7: precisamos serializar duas coisas que chegam concorrentes:
//   1. requisicoes com a MESMA idempotency_key (idempotencia)
//   2. requisicoes do MESMO cartao (limite diario)
//
// A aplicacao roda como um unico processo Node (nao ha cluster/multiplas
// instancias competindo pelo mesmo data.db), entao um lock em memoria e
// suficiente para eliminar a race condition: garante que, para uma dada
// chave, só uma "seção crítica" executa por vez, na ordem de chegada.
//
// Isso funciona encadeando promises: cada chamada nova para a mesma chave
// só começa depois que a anterior terminou (com sucesso ou erro).
//
// Ainda assim, mantemos defesas no nível do banco (constraint unique em
// idempotency_key) para o caso de a aplicação rodar em mais de um processo.

const queues = new Map();

/**
 * Executa `fn` de forma exclusiva para a `key` informada: se já existir uma
 * chamada em andamento (ou na fila) para a mesma chave, esta espera a
 * anterior terminar antes de rodar.
 *
 * Retorna uma Promise que resolve/rejeita com o resultado de `fn`.
 */
export function withLock(key, fn) {
  const previous = queues.get(key) ?? Promise.resolve();

  // Roda fn depois que a fila anterior "assentar" (sucesso ou erro).
  const run = previous.then(fn, fn);

  // Nunca deixa a fila travada por causa de um erro anterior.
  const settled = run.then(
    () => undefined,
    () => undefined,
  );

  queues.set(key, settled);

  // Libera memoria quando não há mais ninguém esperando nessa chave.
  settled.finally(() => {
    if (queues.get(key) === settled) {
      queues.delete(key);
    }
  });

  return run;
}
