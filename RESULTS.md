# 📊 Resultados Completos -- Rinha FullStack SENAI 2026

> Atualizado em: 2026-06-19 16:24:27 UTC  
> Total de times: 6

| # | Time | Pontos | Testes | Status |
|---|------|--------|--------|--------|
| 1 | poussin-devs | **100/100** | 75/75 | OK |
| 2 | soyuz | **100/100** | 75/75 | OK |
| 3 | pingusto193 | **100/100** | 75/75 | OK |
| 4 | htv | **100/100** | 75/75 | OK |
| 5 | logs-pay | **100/100** | 75/75 | OK |
| 6 | pleiades | **79/100** | 33/39 | OK |

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
| Throughput | **1212 txn/s** |
| Total | 200/200 txns em 165ms |
| Latencia avg | 16ms |
| Latencia p50 | 14ms |
| Latencia p95 | 32ms |
| Latencia p99 | 54ms |

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
- ✅ Throughput >= 50 txn/s *(1212 txn/s, 165ms)*
- ✅ P95 < 500ms *(p50=14ms p95=32ms p99=54ms avg=16ms)*
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
| Throughput | **500 txn/s** |
| Total | 200/200 txns em 400ms |
| Latencia avg | 38ms |
| Latencia p50 | 30ms |
| Latencia p95 | 120ms |
| Latencia p99 | 345ms |

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
- ✅ Throughput >= 50 txn/s *(500 txn/s, 400ms)*
- ✅ P95 < 500ms *(p50=30ms p95=120ms p99=345ms avg=38ms)*
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
| Throughput | **345 txn/s** |
| Total | 200/200 txns em 580ms |
| Latencia avg | 56ms |
| Latencia p50 | 36ms |
| Latencia p95 | 253ms |
| Latencia p99 | 502ms |

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
- ✅ Throughput >= 50 txn/s *(345 txn/s, 580ms)*
- ✅ P95 < 500ms *(p50=36ms p95=253ms p99=502ms avg=56ms)*
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
| Throughput | **320 txn/s** |
| Total | 200/200 txns em 625ms |
| Latencia avg | 59ms |
| Latencia p50 | 44ms |
| Latencia p95 | 186ms |
| Latencia p99 | 539ms |

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
- ✅ Throughput >= 50 txn/s *(320 txn/s, 625ms)*
- ✅ P95 < 500ms *(p50=44ms p95=186ms p99=539ms avg=59ms)*
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
| Throughput | **267 txn/s** |
| Total | 200/200 txns em 748ms |
| Latencia avg | 72ms |
| Latencia p50 | 45ms |
| Latencia p95 | 229ms |
| Latencia p99 | 663ms |

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
- ✅ Throughput >= 50 txn/s *(267 txn/s, 748ms)*
- ✅ P95 < 500ms *(p50=45ms p95=229ms p99=663ms avg=72ms)*
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
| Latencia p50 | 38ms |
| Latencia p95 | 158ms |
| Latencia p99 | 455ms |

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
- ✅ P95 < 500ms *(p50=38ms p95=158ms p99=455ms avg=51ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

