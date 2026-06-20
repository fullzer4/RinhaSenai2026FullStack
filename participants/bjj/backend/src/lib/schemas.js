// Schemas de resposta para o Fastify usar fast-json-stringify em vez de
// JSON.stringify generico. Isso reduz significativamente o tempo de
// serializacao sob carga (o gargalo mais comum em APIs JSON de alto
// throughput), pois o serializer e compilado uma unica vez por rota.

export const transactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    status: { type: 'string' },
    card_last4: { type: 'string' },
    card_brand: { type: 'string' },
    holder_name: { type: 'string' },
    amount_cents: { type: 'integer' },
    installments: { type: 'integer' },
    installment_amount: { type: 'integer' },
    total_with_interest: { type: 'integer' },
    fee_cents: { type: 'integer' },
    net_amount: { type: 'integer' },
    description: { type: 'string' },
    created_at: { type: 'string' },
  },
}

export const transactionListResponseSchema = {
  200: {
    type: 'object',
    properties: {
      data: { type: 'array', items: transactionSchema },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
    },
  },
}

export const balanceResponseSchema = {
  200: {
    type: 'object',
    properties: {
      balance_cents: { type: 'integer' },
      total_approved: { type: 'integer' },
      total_declined: { type: 'integer' },
      total_refunded: { type: 'integer' },
    },
  },
}

// NOTA: propositalmente NAO definimos um schema de `body` aqui. O Fastify
// usa Ajv para validar o body contra esse schema *antes* de a rota
// executar, e uma falha de validacao do Ajv retorna HTTP 400 -- o que
// conflita com a regra de negocio "dados invalidos -> 422". Preferimos
// manter o body como JSON livre e fazer toda a validacao (com o codigo de
// status correto) explicitamente em lib/rules.js.
