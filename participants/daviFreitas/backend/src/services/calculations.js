// Cálculos financeiros - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Módulo isolado (Etapa 5), sem I/O e sem dependência do Fastify/Prisma.
// Todas as funções são puras: mesma entrada => mesma saída, fáceis de
// testar. A integração com a rota POST /api/transactions fica pra Etapa 6.

// -------------------------------------------------------------------------
// Bandeiras e taxas (1º dígito do card_number)
// -------------------------------------------------------------------------

const CARD_BRANDS = {
  4: { brand: 'visa', fee_rate: 0.025 },
  5: { brand: 'mastercard', fee_rate: 0.03 },
  3: { brand: 'amex', fee_rate: 0.035 },
  6: { brand: 'elo', fee_rate: 0.04 },
};

/**
 * Detecta a bandeira e a taxa a partir do 1º dígito do card_number.
 * Retorna `null` quando a bandeira é desconhecida (a rota deve responder
 * HTTP 422 e não criar a transação nesse caso).
 */
export function getCardBrand(card_number) {
  const firstDigit = card_number?.[0];
  const entry = CARD_BRANDS[firstDigit];
  return entry ? { ...entry } : null;
}

// -------------------------------------------------------------------------
// Juros por faixa de parcelas
// -------------------------------------------------------------------------

/**
 * Taxa de juros ao mês conforme a faixa de parcelas:
 *   1x        -> sem juros
 *   2x a 6x   -> 2% ao mês (composto)
 *   7x a 12x  -> 4% ao mês (composto)
 */
export function getInterestRate(installments) {
  if (installments === 1) return 0;
  if (installments >= 2 && installments <= 6) return 0.02;
  if (installments >= 7 && installments <= 12) return 0.04;
  throw new RangeError(`installments fora da faixa suportada (1 a 12): ${installments}`);
}

// -------------------------------------------------------------------------
// Valor total com juros compostos
// -------------------------------------------------------------------------

/**
 * total_with_interest = amount_cents * (1 + taxa_juros) ^ installments
 * Arredondado pro centavo mais próximo (valor final é sempre inteiro).
 */
export function calculateTotalWithInterest(amount_cents, installments) {
  const rate = getInterestRate(installments);
  const total = amount_cents * Math.pow(1 + rate, installments);
  return Math.round(total);
}

// -------------------------------------------------------------------------
// Valor da parcela
// -------------------------------------------------------------------------

const MIN_INSTALLMENT_CENTS = 1000; // R$10,00

/**
 * installment_amount = ceil(total_with_interest / installments)
 */
export function calculateInstallmentAmount(total_with_interest, installments) {
  return Math.ceil(total_with_interest / installments);
}

/**
 * true quando o valor da parcela fica abaixo do mínimo permitido (R$10,00).
 * A rota (Etapa 6) deve responder HTTP 422 nesse caso.
 */
export function isBelowMinimumInstallment(installment_amount) {
  return installment_amount < MIN_INSTALLMENT_CENTS;
}

// -------------------------------------------------------------------------
// Taxa da bandeira e valor líquido
// -------------------------------------------------------------------------

/**
 * fee_cents = round(total_with_interest * taxa_bandeira)
 */
export function calculateFee(total_with_interest, fee_rate) {
  return Math.round(total_with_interest * fee_rate);
}

/**
 * net_amount = total_with_interest - fee_cents
 */
export function calculateNetAmount(total_with_interest, fee_cents) {
  return total_with_interest - fee_cents;
}

// -------------------------------------------------------------------------
// Pipeline completo
// -------------------------------------------------------------------------

/**
 * Roda o pipeline financeiro inteiro a partir de amount_cents, installments
 * e card_number. Não decide status (approved/declined) nem grava nada —
 * isso é responsabilidade da rota (Etapa 6). Só retorna os números.
 *
 * Retorna `{ error: 'unknown_brand' }` se a bandeira não for reconhecida,
 * ou `{ error: 'installment_below_minimum', installment_amount }` se a
 * parcela ficar abaixo de R$10,00. Em ambos os casos a rota deve responder
 * HTTP 422 sem criar a transação.
 */
export function calculateTransaction({ amount_cents, installments, card_number }) {
  const brandInfo = getCardBrand(card_number);
  if (!brandInfo) {
    return { error: 'unknown_brand' };
  }

  const total_with_interest = calculateTotalWithInterest(amount_cents, installments);
  const installment_amount = calculateInstallmentAmount(total_with_interest, installments);

  if (isBelowMinimumInstallment(installment_amount)) {
    return { error: 'installment_below_minimum', installment_amount };
  }

  const fee_cents = calculateFee(total_with_interest, brandInfo.fee_rate);
  const net_amount = calculateNetAmount(total_with_interest, fee_cents);

  return {
    card_brand: brandInfo.brand,
    fee_rate: brandInfo.fee_rate,
    total_with_interest,
    installment_amount,
    fee_cents,
    net_amount,
  };
}
