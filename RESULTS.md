# 📊 Resultados Completos -- Rinha FullStack SENAI 2026

> Atualizado em: 2026-06-08 16:23:43 UTC  
> Total de times: 1

| # | Time | Testes | Status |
|---|------|--------|--------|
| 1 | example | 73/73 | OK |

---

<details>
<summary><strong>example</strong> -- ✅ 73/73</summary>

**Membros:** Example Team (@example)

**Regras de negocio:**
- ✅ Health check
- ✅ POST /api/transactions retorna 201
- ✅ Status approved para cartao valido
- ✅ Bandeira visa detectada (4xxx)
- ✅ Taxa visa 2.5% correta (250)
- ✅ net_amount = amount - fee (9750)
- ✅ Idempotencia: mesma key retorna 200
- ✅ Bandeira mastercard detectada (5xxx)
- ✅ Taxa mastercard 3% correta (600)
- ✅ Bandeira amex detectada (3xxx)
- ✅ Bandeira elo detectada (6xxx)
- ✅ Cartao 9999 retorna declined
- ✅ Declined salvo no banco (201)
- ✅ Bandeira invalida rejeitada 422
- ✅ Juros compostos 2%/mes (3x) *(total_with_interest=15919)*
- ✅ Parcela com ceil correto *(installment_amount=5307)*
- ✅ Taxa sobre amount_cents (fee=375)
- ✅ net_amount = amount - fee (14625)
- ✅ Juros compostos 4%/mes (7x) *(esperado=131594 recebido=131594)*
- ✅ Parcela abaixo R$10 rejeitada 422
- ✅ Estorno funciona (approved -> refunded) *(status=200 body_status=refunded error=none)*
- ✅ Double refund rejeitado 422 *(status=422)*
- ✅ Balance endpoint funciona
- ✅ Declined nao conta no saldo
- ✅ Paginacao funciona

**Frontend (Playwright):**
- ✅ Dashboard carrega (GET /)
- ✅ Elemento .input-card-number existe
- ✅ Elemento .input-holder-name existe
- ✅ Elemento .input-expiration existe
- ✅ Elemento .input-cvv existe
- ✅ Elemento .input-amount existe
- ✅ Elemento .select-installments existe
- ✅ Elemento .input-description existe
- ✅ Elemento .btn-pay existe
- ✅ Elemento .display-balance existe
- ✅ Elemento .display-total-approved existe
- ✅ Elemento .display-total-declined existe
- ✅ Elemento .display-total-refunded existe
- ✅ Feedback apos submit
- ✅ Transacao aprovada via form
- ✅ Pagina /history carrega
- ✅ Lista de transacoes existe
- ✅ Transacoes aparecem no historico *(9 items)*
- ✅ Item tem .transaction-id
- ✅ Item tem .transaction-status
- ✅ Item tem .transaction-amount
- ✅ Item tem .transaction-brand
- ✅ Item tem .transaction-installments
- ✅ Item tem .transaction-fee
- ✅ Item tem .transaction-description
- ✅ Paginacao .pagination-current existe
- ✅ Paginacao .pagination-pages existe
- ✅ Paginacao .pagination-total existe
- ✅ Paginacao .btn-prev-page existe
- ✅ Paginacao .btn-next-page existe
- ✅ Pagina /transaction/:id carrega
- ✅ Detalhe tem .detail-id
- ✅ Detalhe tem .detail-status
- ✅ Detalhe tem .detail-amount
- ✅ Detalhe tem .detail-brand
- ✅ Detalhe tem .detail-holder
- ✅ Detalhe tem .detail-card
- ✅ Detalhe tem .detail-installments
- ✅ Detalhe tem .detail-fee
- ✅ Detalhe tem .detail-net
- ✅ Detalhe tem .detail-description
- ✅ Detalhe tem .detail-date
- ✅ SPA fallback funciona (/history sem query)

**Stress test:**
- ✅ 30/30 transacoes criadas *(30 de 30)*
- ✅ Zero erros 500
- ✅ Throughput: 43 txn/s *(692ms)*
- ✅ Idempotencia concorrente: 1 criada + N duplicatas *(201=1 200=4)*
- ✅ Double refund concorrente: apenas 1 estorno *(1 estornos)*

</details>

