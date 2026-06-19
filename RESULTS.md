# 📊 Resultados Completos -- Rinha FullStack SENAI 2026

> Atualizado em: 2026-06-19 13:11:45 UTC  
> Total de times: 3

| # | Time | Pontos | Testes | Status |
|---|------|--------|--------|--------|
| 1 | poussin-devs | **100/100** | 75/75 | OK |
| 2 | soyuz | **100/100** | 75/75 | OK |
| 3 | htv | **100/100** | 75/75 | OK |

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
| Throughput | **1170 txn/s** |
| Total | 200/200 txns em 171ms |
| Latencia avg | 16ms |
| Latencia p50 | 13ms |
| Latencia p95 | 37ms |
| Latencia p99 | 46ms |

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
- ✅ Throughput >= 50 txn/s *(1170 txn/s, 171ms)*
- ✅ P95 < 500ms *(p50=13ms p95=37ms p99=46ms avg=16ms)*
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
| Throughput | **501 txn/s** |
| Total | 200/200 txns em 399ms |
| Latencia avg | 38ms |
| Latencia p50 | 25ms |
| Latencia p95 | 170ms |
| Latencia p99 | 333ms |

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
- ✅ Throughput >= 50 txn/s *(501 txn/s, 399ms)*
- ✅ P95 < 500ms *(p50=25ms p95=170ms p99=333ms avg=38ms)*
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
| Throughput | **334 txn/s** |
| Total | 200/200 txns em 598ms |
| Latencia avg | 57ms |
| Latencia p50 | 40ms |
| Latencia p95 | 182ms |
| Latencia p99 | 515ms |

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
- ✅ Throughput >= 50 txn/s *(334 txn/s, 598ms)*
- ✅ P95 < 500ms *(p50=40ms p95=182ms p99=515ms avg=57ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

