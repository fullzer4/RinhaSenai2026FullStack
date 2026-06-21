# Gateway de Pagamento — SENAI 2026

Implementação completa do gateway fake para a Rinha FullStack SENAI 2026.

## Stack

| Camada   | Tecnologia               |
|----------|--------------------------|
| Backend  | Node.js + Fastify        |
| Frontend | React + Vite             |
| Banco    | SQLite nativo (Node 22+) |
| Porta    | 3000 (única)             |

## Como rodar

```bash
# 1. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Buildar o frontend
cd frontend && npm run build

# 3. Subir o servidor
cd backend && node src/server.js

# Acesse http://localhost:3000
```

## Regras implementadas

- ✅ Bandeiras: Visa (2.5%), Mastercard (3%), Amex (3.5%), Elo (4%)
- ✅ Juros compostos: 2% a.m. (2–6x) e 4% a.m. (7–12x)
- ✅ Limite diário de R$5.000 por cartão (card_last4)
- ✅ Cartão 9999xxxx → status `declined`
- ✅ Estorno com proteção contra double-refund
- ✅ Idempotência via `idempotency_key`
- ✅ SQLite WAL mode para concorrência
- ✅ Todas as classes CSS exigidas pelo benchmark
- ✅ Deep-link `/history?page=N&limit=M`
- ✅ Paginação completa com `useSearchParams`
