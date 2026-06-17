# 📊 Resultados Completos -- Rinha FullStack SENAI 2026

> Atualizado em: 2026-06-16 17:07:37 UTC  
> Total de times: 1

| # | Time | Pontos | Testes | Status |
|---|------|--------|--------|--------|
| 1 | poussin-devs | **100/100** | 75/75 | OK |

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
| Throughput | **606 txn/s** |
| Total | 200/200 txns em 330ms |
| Latencia avg | 31ms |
| Latencia p50 | 20ms |
| Latencia p95 | 136ms |
| Latencia p99 | 242ms |

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
- ✅ Throughput >= 50 txn/s *(606 txn/s, 330ms)*
- ✅ P95 < 500ms *(p50=20ms p95=136ms p99=242ms avg=31ms)*
- ✅ Idempotencia concorrente *(201=1 200=9)*
- ✅ Apenas 1 estorno concorrente *(1 estornos)*
- ✅ Read/Write concorrente *(50/50 writes, 50/50 reads)*

</details>

