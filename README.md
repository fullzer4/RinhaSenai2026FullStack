# Pagaro — Gateway de Pagamento Fake

Implementação para a Rinha SENAI 2026 Full Stack. Backend Node.js + Fastify,
frontend React + Vite, banco SQLite + Prisma. Tudo servido na porta 3000.

## Como rodar

```bash
npm install
npm run build   # gera frontend/dist
npm start       # roda prisma db push + sobe o servidor na porta 3000
```

## Arquitetura de concorrência (o ponto central da competição)

SQLite permite **um único writer ativo por vez** no arquivo, independente
de quantas conexões a aplicação abra. Em vez de lutar contra essa restrição
com múltiplas conexões concorrentes (o que gera `SQLITE_BUSY`, retries
custosos e — mais grave — janelas de "check-then-act" onde duas requisições
leem o mesmo saldo antes de qualquer uma escrever), a estratégia adotada foi
**serializar todas as escritas dentro do próprio processo Node**, com uma
fila de promessas (`src/lib/mutex.js`).

Isso transforma três operações que seriam problemas clássicos de
concorrência em operações atomicamente seguras por construção:

1. **Idempotência** — o lookup por `idempotency_key` e o `INSERT`
   subsequente acontecem dentro da mesma seção crítica do mutex. Nenhuma
   segunda requisição com a mesma key pode "passar" entre o SELECT e o
   INSERT da primeira.
2. **Limite diário por cartão** — a soma do total aprovado do dia e o
   `INSERT` da nova transação também rodam na mesma seção crítica. O
   clássico TOCTOU (time-of-check to time-of-use) desaparece porque não há
   como outra escrita se intercalar.
3. **Refund** — protegido em duas camadas: o mutex evita contenção, e o
   `UPDATE ... WHERE id = ? AND status = 'approved'` é atômico no nível do
   SQLite mesmo sem o mutex (apenas uma das chamadas concorrentes vai casar
   com a cláusula `WHERE`; as demais afetam 0 linhas).

O custo de serializar é mínimo: cada operação é uma query local de
sub-milissegundo, então a fila não se torna um gargalo perceptível mesmo
sob a carga de 200 requisições concorrentes exigida pelos testes de stress
(throughput medido >10.000 ops/s na camada de lógica pura, muito acima do
mínimo de 50 txn/s exigido).

Leituras (`GET`) **não** passam pelo mutex — continuam livres e paralelas,
e o modo WAL garante que elas nunca são bloqueadas por uma escrita em
andamento.

### SQLite: PRAGMAs aplicados (`src/db.js`)

| PRAGMA | Valor | Motivo |
|---|---|---|
| `journal_mode` | `WAL` | Leitores não bloqueiam escritor e vice-versa |
| `busy_timeout` | `5000` | Rede de segurança contra `SQLITE_BUSY` externo ao mutex |
| `synchronous` | `NORMAL` | Seguro em WAL, evita fsync custoso a cada commit |
| `cache_size` | `-16000` (16MB) | Reduz I/O de disco em leituras repetidas |
| `temp_store` | `MEMORY` | Índices/tabelas temporárias em RAM |

### Índices (`prisma/schema.prisma`)

- `(card_last4, status, created_at)` — acelera a soma do limite diário por
  cartão, o hot-path mais crítico sob concorrência.
- `idempotency_key` (`@unique`) — constraint de banco como segunda camada
  de defesa de idempotência, além do mutex.
- `created_at` — acelera `ORDER BY created_at DESC` na paginação.
- `status` — acelera os agregados de `/api/balance`.

## Regras de negócio implementadas

- Bandeira por primeiro dígito: `4` Visa (2.5%), `5` Mastercard (3.0%),
  `3` Amex (3.5%), `6` Elo (4.0%); qualquer outro prefixo (exceto o cartão
  de teste `9999...`) é rejeitado com `422`.
- Cartões iniciados em `9999` são sempre `declined` (e salvos como tal,
  HTTP 201), independente de não mapearem para uma bandeira reconhecida.
- Juros compostos: 1x sem juros; 2x–6x a 2% a.m.; 7x–12x a 4% a.m.
  `total_with_interest = ceil(amount_cents * (1 + taxa)^parcelas)`.
- Parcela mínima de 1000 centavos — abaixo disso, `422`.
- `fee_cents = round(amount_cents * taxa_da_bandeira)`,
  `net_amount = amount_cents - fee_cents`.
- Limite diário de 500.000 centavos por cartão (`card_last4`), validado
  atomicamente conforme descrito acima.

## Frontend

SPA em React Router com três rotas (`/`, `/history`, `/transaction/:id`),
todas com deep linking funcional (`/history?page=2&limit=20` reflete o
estado real e pode ser acessado diretamente). Identidade visual de
"livro-caixa": papel claro, réguas finas, números tabulares alinhados, e
o status de cada lançamento representado como um carimbo rotacionado.
