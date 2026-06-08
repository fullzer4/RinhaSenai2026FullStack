# Regras de Negocio - Gateway de Pagamento

O gateway fake simula um processador de pagamentos com regras reais. O benchmark valida que **todas** as regras foram aplicadas corretamente.

---

## API REST

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/transactions` | Cria uma transacao |
| GET | `/api/transactions/:id` | Consulta uma transacao pelo ID |
| GET | `/api/transactions?page=1&limit=10` | Lista transacoes com paginacao |
| POST | `/api/transactions/:id/refund` | Estorna uma transacao |
| GET | `/api/balance` | Retorna saldo atual |
| GET | `/api/health` | Retorna `{ "status": "ok" }` |

---

## Bandeiras de cartao

O primeiro digito do `card_number` define a bandeira e a **taxa** cobrada:

| Primeiro digito | Bandeira | Taxa |
|----------------|----------|------|
| 4 | Visa | 2.5% |
| 5 | Mastercard | 3.0% |
| 3 | Amex | 3.5% |
| 6 | Elo | 4.0% |
| Qualquer outro | Desconhecida | rejeitar (HTTP 422) |

A taxa e calculada sobre o `amount_cents`. Exemplo: R$100,00 (10000 centavos) com Visa = taxa de R$2,50 (250 centavos).

---

## Parcelas (installments)

| Parcelas | Regra |
|----------|-------|
| 1x | Sem juros |
| 2x a 6x | Juros de 2% ao mes (composto) |
| 7x a 12x | Juros de 4% ao mes (composto) |

**Formula:** `total_with_interest = amount_cents * (1 + taxa_juros) ^ parcelas`

**Valor da parcela:** `installment_amount = Math.ceil(total_with_interest / installments)`

**Restricao:** valor minimo por parcela e **R$10,00** (1000 centavos). Se `total_with_interest / installments < 1000` = HTTP 422.

---

## Limite diario por cartao

Cada cartao (identificado por `card_last4`) tem um **limite diario de R$5.000,00** (500000 centavos) em transacoes aprovadas. Se a soma do dia + nova transacao ultrapassar o limite = HTTP 422.

---

## Status da transacao

| Cenario | Status |
|---------|--------|
| Cartao comeca com `9999` | `declined` |
| Limite diario excedido | `declined` |
| Bandeira desconhecida | HTTP 422 (nao cria transacao) |
| Parcela abaixo do minimo | HTTP 422 |
| Campos invalidos | HTTP 422 |
| Tudo ok | `approved` |

Transacoes `declined` **sao salvas** no banco mas **nao contam** no saldo nem no limite diario.

---

## Estorno (refund)

- So pode estornar transacoes com status `approved`
- Status muda para `refunded`
- Nao pode estornar duas vezes a mesma transacao
- Usar `UPDATE ... WHERE status = 'approved'` para prevenir double refund

---

## Validacoes de campos

- `amount_cents` deve ser > 0 e <= 1000000 (R$10.000,00)
- `card_number` exatamente 16 digitos numericos
- `cvv` 3 ou 4 digitos numericos
- `holder_name` nao pode estar vazio, max 50 caracteres, sem tags HTML
- `expiration` formato MM/YY, nao pode estar vencido
- `installments` inteiro de 1 a 12 (default 1)
- `description` obrigatoria, max 100 caracteres
- `card_number` **nunca** e retornado inteiro -- so `card_last4`
- Paginacao: `page` default 1, `limit` default 10, max 100

---

## POST /api/transactions

**Request:**

```json
{
  "card_number": "4111111111111111",
  "holder_name": "Joao Silva",
  "expiration": "12/28",
  "cvv": "123",
  "amount_cents": 15000,
  "installments": 3,
  "description": "Camiseta SENAI"
}
```

**Response (201):**

```json
{
  "id": "uuid-gerado",
  "status": "approved",
  "card_last4": "1111",
  "card_brand": "visa",
  "holder_name": "Joao Silva",
  "amount_cents": 15000,
  "installments": 3,
  "installment_amount": 5305,
  "total_with_interest": 15916,
  "fee_cents": 375,
  "net_amount": 14625,
  "description": "Camiseta SENAI",
  "created_at": "2026-06-06T12:00:00Z"
}
```

## GET /api/transactions?page=2&limit=10

**Response (200):**

```json
{
  "data": [ { "...campos da transacao..." } ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 57,
    "total_pages": 6
  }
}
```

## GET /api/balance

**Response (200):**

```json
{
  "balance_cents": 1462500,
  "total_approved": 150,
  "total_declined": 12,
  "total_refunded": 3
}
```

---

## Calculos

A taxa da bandeira e calculada sobre o `total_with_interest` (valor com juros):

```
fee_cents = Math.round(total_with_interest * taxa_bandeira)
net_amount = total_with_interest - fee_cents
```

---

## Frontend -- Classes CSS obrigatorias

O benchmark usa **classes CSS** para localizar elementos via Playwright. Layout e design sao livres, mas as classes devem estar nos elementos corretos.

### Pagina `/` -- Dashboard

**Formulario:**

| Elemento | Classe CSS | Tag |
|----------|-----------|-----|
| Numero do cartao | `.input-card-number` | `<input>` |
| Nome do titular | `.input-holder-name` | `<input>` |
| Validade | `.input-expiration` | `<input>` |
| CVV | `.input-cvv` | `<input>` |
| Valor (centavos) | `.input-amount` | `<input>` |
| Parcelas | `.select-installments` | `<select>` |
| Descricao | `.input-description` | `<input>` |
| Botao pagar | `.btn-pay` | `<button>` |

**Feedback:**

| Elemento | Classe CSS | Quando aparece |
|----------|-----------|---------------|
| Sucesso | `.feedback-success` | Transacao approved |
| Erro | `.feedback-error` | Erro 422 ou declined |

**Saldo (usar `data-value` com valor bruto):**

| Elemento | Classe CSS | `data-value` |
|----------|-----------|-------------|
| Saldo liquido | `.display-balance` | Centavos |
| Total aprovadas | `.display-total-approved` | Numero |
| Total recusadas | `.display-total-declined` | Numero |
| Total estornadas | `.display-total-refunded` | Numero |

```html
<span class="display-balance" data-value="1462500">R$ 14.625,00</span>
```

### Pagina `/history?page=1&limit=10` -- Historico

**Lista:**

| Elemento | Classe CSS |
|----------|-----------|
| Container | `.list-transactions` |
| Cada item | `.transaction-item` |

**Dentro de cada `.transaction-item` (usar `data-value`):**

| Elemento | Classe CSS | `data-value` |
|----------|-----------|-------------|
| ID | `.transaction-id` | UUID |
| Status | `.transaction-status` | `approved`/`declined`/`refunded` |
| Valor | `.transaction-amount` | Centavos |
| Bandeira | `.transaction-brand` | `visa`/`mastercard`/`amex`/`elo` |
| Parcelas | `.transaction-installments` | Numero |
| Valor parcela | `.transaction-installment-amount` | Centavos |
| Total c/ juros | `.transaction-total` | Centavos |
| Taxa | `.transaction-fee` | Centavos |
| Descricao | `.transaction-description` | Texto |
| Ultimos 4 | `.transaction-card` | 4 digitos |
| Data | `.transaction-date` | ISO 8601 |
| Estorno | `.btn-refund` | `<button>` |

**Paginacao:**

| Elemento | Classe CSS | `data-value` |
|----------|-----------|-------------|
| Pagina atual | `.pagination-current` | Numero |
| Total paginas | `.pagination-pages` | Numero |
| Total transacoes | `.pagination-total` | Numero |
| Anterior | `.btn-prev-page` | `disabled` na pag 1 |
| Proximo | `.btn-next-page` | `disabled` na ultima |

**Comportamento:** acessar `/history?page=3&limit=20` deve mostrar a pagina 3 direto (deep link via `useSearchParams`).

### Pagina `/transaction/:id` -- Detalhe

| Elemento | Classe CSS | `data-value` |
|----------|-----------|-------------|
| ID | `.detail-id` | UUID |
| Status | `.detail-status` | `approved`/`declined`/`refunded` |
| Valor | `.detail-amount` | Centavos |
| Bandeira | `.detail-brand` | Texto |
| Titular | `.detail-holder` | Texto |
| Ultimos 4 | `.detail-card` | 4 digitos |
| Parcelas | `.detail-installments` | Numero |
| Valor parcela | `.detail-installment-amount` | Centavos |
| Total c/ juros | `.detail-total` | Centavos |
| Taxa | `.detail-fee` | Centavos |
| Valor liquido | `.detail-net` | Centavos |
| Descricao | `.detail-description` | Texto |
| Data | `.detail-date` | ISO 8601 |
| Estorno | `.btn-refund` | So visivel se approved |

---

## Desafios tecnicos

### Idempotencia

O bench envia a **mesma requisicao** multiplas vezes simultaneamente. O sistema **nao pode** criar transacoes duplicadas. Se dois requests identicos chegarem ao mesmo tempo, apenas **uma** transacao deve existir no banco.

O bench valida isso: percorre o historico inteiro e confere que nao ha duplicatas.

### SQLite e concorrencia

SQLite so permite uma escrita por vez. Com multiplas requisicoes simultaneas, o banco vai retornar erros se nao estiver configurado corretamente. Pesquise sobre **WAL mode** e **busy timeout**.

### Race condition no limite diario

O bench manda multiplas transacoes do **mesmo cartao** ao mesmo tempo. Se a checagem do limite nao for atomica, o limite pode ser ultrapassado.

### Double refund

O bench manda estorno da **mesma transacao** de 2 requests ao mesmo tempo. O sistema deve estornar apenas uma vez.

---

## Pontuacao (100 pontos)

| Categoria | Pontos | O que testa |
|-----------|--------|-------------|
| Regras de negocio | 50 | Taxas, juros, limites, estorno, idempotencia, concorrencia |
| Frontend | 30 | Classes CSS, formulario, historico, paginacao |
| Stress test | 20 | 200 txns concorrentes, throughput, latencia p95 |
