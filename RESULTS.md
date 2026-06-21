# 📊 Resultados Completos -- Rinha FullStack SENAI 2026

> Atualizado em: 2026-06-20 11:54:51 UTC  
> Total de times: 7

| # | Time | Pontos | Testes | Status |
|---|------|--------|--------|--------|
| 1 | poussin-devs | **100/100** | 75/75 | OK |
| 2 | maneuchos | **100/100** | 75/75 | OK |
| 3 | soyuz | **100/100** | 75/75 | OK |
| 4 | pingusto193 | **100/100** | 75/75 | OK |
| 5 | htv | **100/100** | 75/75 | OK |
| 6 | logs-pay | **100/100** | 75/75 | OK |
| 7 | pleiades | **79/100** | 33/39 | OK |

---

<details>
<summary><strong>poussin-devs</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** Victor Morsoletto (@victoroliveira6-ops)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **1235 txn/s** |
| Total | 200/200 txns em 162ms |
| Latencia avg | 15ms |
| Latencia p50 | 12ms |
| Latencia p95 | 35ms |
| Latencia p99 | 48ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(1235 txn/s, 162ms)*
- ✅ P95 < 500ms *(p50=12ms p95=35ms p99=48ms avg=15ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>maneuchos</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** Caetano Rocha de Oliveira (@caetanorocha1113), Larissa Amorim Kussler (@Lari0216), Lucas Corrêia  (@Lucas-Salvo), Lorenzo Kurle Borges (@LorenzoKBorges)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **524 txn/s** |
| Total | 200/200 txns em 382ms |
| Latencia avg | 36ms |
| Latencia p50 | 22ms |
| Latencia p95 | 183ms |
| Latencia p99 | 280ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(524 txn/s, 382ms)*
- ✅ P95 < 500ms *(p50=22ms p95=183ms p99=280ms avg=36ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>soyuz</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** Antonio Vedana (@sessentaeseis), Arthur Wolf (@awkoode), Lucas Vargas (@lcsvargas), Miguel Wolf (@miguel-wolf263)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **476 txn/s** |
| Total | 200/200 txns em 420ms |
| Latencia avg | 40ms |
| Latencia p50 | 26ms |
| Latencia p95 | 164ms |
| Latencia p99 | 349ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(476 txn/s, 420ms)*
- ✅ P95 < 500ms *(p50=26ms p95=164ms p99=349ms avg=40ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>pingusto193</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** Gustavo Ramos (@Pingusto193), Guilherme Bruno (@guilherme), Diogo (@diogo)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **406 txn/s** |
| Total | 200/200 txns em 493ms |
| Latencia avg | 47ms |
| Latencia p50 | 35ms |
| Latencia p95 | 154ms |
| Latencia p99 | 418ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(406 txn/s, 493ms)*
- ✅ P95 < 500ms *(p50=35ms p95=154ms p99=418ms avg=47ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>htv</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** João Hartmann (@jjoaohartmann), Maria Eduarda (@MariaTessari), Júlia Veríssimo (@juliaverissimo)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **321 txn/s** |
| Total | 200/200 txns em 624ms |
| Latencia avg | 59ms |
| Latencia p50 | 43ms |
| Latencia p95 | 184ms |
| Latencia p99 | 540ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(321 txn/s, 624ms)*
- ✅ P95 < 500ms *(p50=43ms p95=184ms p99=540ms avg=59ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>logs-pay</strong> -- ✅ 100/100 pts — 75/75 testes</summary>

**Membros:** Arthur Gabriel (@PingoGB), Kauã Santos (@kauasrocha-ai), Kallany Santos (@oBiga32), Maria Eduarda (@Eduardamaria01), Josefa (@SleepyHani07)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 25/25 | **50/50** |
| Frontend | 43/43 | **30/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **75/75** | **100/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **301 txn/s** |
| Total | 200/200 txns em 665ms |
| Latencia avg | 63ms |
| Latencia p50 | 44ms |
| Latencia p95 | 249ms |
| Latencia p99 | 562ms |

**Regras de negocio:**
- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919) *(recebido=15919)*
- ✅ installment_amount com ceil (5307) *(recebido=5307)*
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded *(status=refunded)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega
- ✅ Elemento .input-card-number
- ✅ Elemento .input-holder-name
- ✅ Elemento .input-expiration
- ✅ Elemento .input-cvv
- ✅ Elemento .input-amount
- ✅ Elemento .select-installments
- ✅ Elemento .input-description
- ✅ Elemento .btn-pay
- ✅ Elemento .display-balance
- ✅ Elemento .display-total-approved
- ✅ Elemento .display-total-declined
- ✅ Elemento .display-total-refunded
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current
- ✅ Paginacao .pagination-pages
- ✅ Paginacao .pagination-total
- ✅ Paginacao .btn-prev-page
- ✅ Paginacao .btn-next-page
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe .detail-id
- ✅ Detalhe .detail-status
- ✅ Detalhe .detail-amount
- ✅ Detalhe .detail-brand
- ✅ Detalhe .detail-holder
- ✅ Detalhe .detail-card
- ✅ Detalhe .detail-installments
- ✅ Detalhe .detail-fee
- ✅ Detalhe .detail-net
- ✅ Detalhe .detail-description
- ✅ Detalhe .detail-date
- ✅ SPA fallback (/history sem query)

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(301 txn/s, 665ms)*
- ✅ P95 < 500ms *(p50=44ms p95=249ms p99=562ms avg=63ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

<details>
<summary><strong>pleiades</strong> -- ✅ 79/100 pts — 33/39 testes</summary>

**Membros:** Cleyton (@Pingusto193), Ramos (@BoaSorteRamos), Guilherme Bruno (@guilherme_c_bruno@etudante.sesisenai.org.br)

| Categoria | Testes | Pontos |
|-----------|--------|--------|
| Regras de negocio | 23/24 | **48/50** |
| Frontend | 3/8 | **11/30** |
| Stress | 7/7 | **20/20** |
| **Total** | **33/39** | **79/100** |

**Performance:**

| Metrica | Valor |
|---------|-------|
| Throughput | **374 txn/s** |
| Total | 200/200 txns em 535ms |
| Latencia avg | 51ms |
| Latencia p50 | 36ms |
| Latencia p95 | 163ms |
| Latencia p99 | 444ms |

**Regras de negocio:**
- ❌ Balance funciona
<details><summary>✅ 23 passando</summary>

- ✅ Health check
- ✅ POST retorna 201
- ✅ Status approved
- ✅ Bandeira visa (4xxx)
- ✅ Taxa visa 2.5% (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia retorna 200
- ✅ Bandeira mastercard (5xxx)
- ✅ Taxa mastercard 3% (600)
- ✅ Bandeira amex (3xxx)
- ✅ Bandeira elo (6xxx)
- ✅ Cartao 9999 declined
- ✅ Declined salvo (201)
- ✅ Bandeira invalida 422
- ✅ total_with_interest correto (15919)
- ✅ installment_amount com ceil (5307)
- ✅ Taxa sobre amount_cents (375)
- ✅ net_amount correto (14625)
- ✅ Juros 4%/mes (7x)
- ✅ Parcela minima R$10 422
- ✅ Estorno approved -> refunded
- ✅ Double refund rejeitado 422
- ✅ Paginacao funciona
</details>

**Frontend (Playwright):**
- ❌ Elemento .input-card-number
- ❌ Elemento .display-balance
- ❌ Lista de transacoes existe
- ❌ Paginacao .pagination-current
- ❌ Pagina /transaction/:id carrega — 
<details><summary>✅ 3 passando</summary>

- ✅ Dashboard carrega
- ✅ Pagina /history carrega
- ✅ SPA fallback (/history sem query)
</details>

**Stress test:**
- ✅ 200/200 transacoes criadas *(0 err500, 0 err422)*
- ✅ Zero erros 500
- ✅ Throughput >= 50 txn/s *(374 txn/s, 535ms)*
- ✅ P95 < 500ms *(p50=36ms p95=163ms p99=444ms avg=51ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

