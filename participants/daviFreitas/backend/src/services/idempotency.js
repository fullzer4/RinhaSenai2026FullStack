// Idempotência - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Etapa 7: o bench manda a MESMA requisição várias vezes simultaneamente e
// espera que apenas UMA transação exista no banco no final.
//
// Não há um header de idempotência explícito na REGRA_DE_NEGOCIO.md, então
// derivamos a chave a partir do próprio conteúdo da requisição: duas
// requisições com exatamente os mesmos campos geram a mesma chave.

import crypto from 'node:crypto';

/**
 * Gera a idempotency_key a partir dos campos relevantes do payload já
 * validado/normalizado (installments com default aplicado). A ordem das
 * chaves no objeto é fixa para garantir que o JSON.stringify seja sempre
 * igual para o mesmo conteúdo lógico.
 */
export function computeIdempotencyKey(data) {
  const canonical = JSON.stringify({
    card_number: data.card_number,
    holder_name: data.holder_name,
    expiration: data.expiration,
    cvv: data.cvv,
    amount_cents: data.amount_cents,
    installments: data.installments,
    description: data.description,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}
