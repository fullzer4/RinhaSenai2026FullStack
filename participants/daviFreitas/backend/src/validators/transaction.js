// Validações de campo - Rinha FullStack SENAI 2026 (time: davidefreitas)
//
// Módulo isolado (Etapa 4). Cada função de campo retorna `null` quando o
// valor é válido, ou uma string com a mensagem de erro quando inválido.
// A função `validateTransactionInput` agrega tudo e é o que a rota
// (Etapa 6) vai chamar para decidir entre seguir com a transação ou
// responder HTTP 422.

const HTML_TAG_REGEX = /<[^>]*>/;
const CARD_NUMBER_REGEX = /^\d{16}$/;
const CVV_REGEX = /^\d{3,4}$/;
const EXPIRATION_REGEX = /^(0[1-9]|1[0-2])\/(\d{2})$/;

const AMOUNT_MIN_CENTS = 1;
const AMOUNT_MAX_CENTS = 1_000_000; // R$10.000,00
const HOLDER_NAME_MAX_LEN = 50;
const DESCRIPTION_MAX_LEN = 100;
const INSTALLMENTS_MIN = 1;
const INSTALLMENTS_MAX = 12;
const INSTALLMENTS_DEFAULT = 1;

/**
 * amount_cents: inteiro, > 0 e <= 1.000.000 (R$10.000,00)
 */
export function validateAmountCents(amount_cents) {
  if (amount_cents === undefined || amount_cents === null) {
    return 'amount_cents é obrigatório';
  }
  if (typeof amount_cents !== 'number' || !Number.isInteger(amount_cents)) {
    return 'amount_cents deve ser um número inteiro (centavos)';
  }
  if (amount_cents < AMOUNT_MIN_CENTS || amount_cents > AMOUNT_MAX_CENTS) {
    return `amount_cents deve ser maior que 0 e no máximo ${AMOUNT_MAX_CENTS} (R$10.000,00)`;
  }
  return null;
}

/**
 * card_number: exatamente 16 dígitos numéricos.
 * (A bandeira/taxa a partir do 1º dígito é responsabilidade da Etapa 5 —
 * aqui só validamos o formato.)
 */
export function validateCardNumber(card_number) {
  if (card_number === undefined || card_number === null || card_number === '') {
    return 'card_number é obrigatório';
  }
  if (typeof card_number !== 'string' || !CARD_NUMBER_REGEX.test(card_number)) {
    return 'card_number deve conter exatamente 16 dígitos numéricos';
  }
  return null;
}

/**
 * cvv: 3 ou 4 dígitos numéricos.
 */
export function validateCvv(cvv) {
  if (cvv === undefined || cvv === null || cvv === '') {
    return 'cvv é obrigatório';
  }
  if (typeof cvv !== 'string' || !CVV_REGEX.test(cvv)) {
    return 'cvv deve conter 3 ou 4 dígitos numéricos';
  }
  return null;
}

/**
 * holder_name: não vazio, max 50 caracteres, sem tags HTML.
 */
export function validateHolderName(holder_name) {
  if (typeof holder_name !== 'string' || holder_name.trim().length === 0) {
    return 'holder_name não pode estar vazio';
  }
  if (holder_name.length > HOLDER_NAME_MAX_LEN) {
    return `holder_name deve ter no máximo ${HOLDER_NAME_MAX_LEN} caracteres`;
  }
  if (HTML_TAG_REGEX.test(holder_name)) {
    return 'holder_name não pode conter tags HTML';
  }
  return null;
}

/**
 * expiration: formato MM/YY, não pode estar vencido.
 * O cartão é considerado válido até o último dia do mês/ano informado.
 */
export function validateExpiration(expiration, now = new Date()) {
  if (typeof expiration !== 'string') {
    return 'expiration é obrigatório';
  }

  const match = EXPIRATION_REGEX.exec(expiration);
  if (!match) {
    return 'expiration deve estar no formato MM/YY';
  }

  const month = Number(match[1]); // 1-12
  const year = 2000 + Number(match[2]);

  // Último instante do mês de expiração (dia 0 do mês seguinte = último dia do mês atual)
  const expiresAt = new Date(year, month, 0, 23, 59, 59, 999);

  if (expiresAt.getTime() < now.getTime()) {
    return 'card_number está com a validade vencida';
  }

  return null;
}

/**
 * installments: inteiro de 1 a 12 (default 1 quando ausente).
 */
export function validateInstallments(installments) {
  if (installments === undefined || installments === null) {
    return null; // default será aplicado em normalizeInstallments
  }
  if (typeof installments !== 'number' || !Number.isInteger(installments)) {
    return 'installments deve ser um número inteiro';
  }
  if (installments < INSTALLMENTS_MIN || installments > INSTALLMENTS_MAX) {
    return `installments deve ser um inteiro entre ${INSTALLMENTS_MIN} e ${INSTALLMENTS_MAX}`;
  }
  return null;
}

/**
 * Aplica o default de installments (1) quando o campo não foi enviado.
 * Só deve ser usado depois que validateInstallments confirmou que o valor
 * (se presente) é válido.
 */
export function normalizeInstallments(installments) {
  if (installments === undefined || installments === null) {
    return INSTALLMENTS_DEFAULT;
  }
  return installments;
}

/**
 * description: obrigatória, max 100 caracteres.
 */
export function validateDescription(description) {
  if (typeof description !== 'string' || description.trim().length === 0) {
    return 'description é obrigatória';
  }
  if (description.length > DESCRIPTION_MAX_LEN) {
    return `description deve ter no máximo ${DESCRIPTION_MAX_LEN} caracteres`;
  }
  return null;
}

/**
 * Valida o payload completo de POST /api/transactions.
 *
 * Retorna:
 *   {
 *     valid: boolean,
 *     errors: [{ field, message }],
 *     data: payload normalizado (installments com default aplicado)
 *   }
 *
 * Não valida bandeira desconhecida nem valor mínimo de parcela — isso
 * depende dos cálculos financeiros (Etapa 5) e é tratado na rota (Etapa 6).
 */
export function validateTransactionInput(body) {
  const payload = body ?? {};
  const errors = [];

  const checks = [
    ['amount_cents', validateAmountCents(payload.amount_cents)],
    ['card_number', validateCardNumber(payload.card_number)],
    ['cvv', validateCvv(payload.cvv)],
    ['holder_name', validateHolderName(payload.holder_name)],
    ['expiration', validateExpiration(payload.expiration)],
    ['installments', validateInstallments(payload.installments)],
    ['description', validateDescription(payload.description)],
  ];

  for (const [field, message] of checks) {
    if (message) {
      errors.push({ field, message });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      ...payload,
      installments: normalizeInstallments(payload.installments),
    },
  };
}

/**
 * Formata o corpo de resposta HTTP 422 a partir dos erros de validação.
 * Uso esperado na rota (Etapa 6):
 *
 *   const result = validateTransactionInput(request.body);
 *   if (!result.valid) {
 *     return reply.code(422).send(formatValidationErrors(result.errors));
 *   }
 */
export function formatValidationErrors(errors) {
  return {
    error: 'validation_error',
    message: 'Um ou mais campos são inválidos',
    fields: errors,
  };
}
