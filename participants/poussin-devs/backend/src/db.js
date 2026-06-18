import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:../data.db' })
const prisma = new PrismaClient({ adapter })

await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL')

await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT NOT NULL PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    card_last4 TEXT NOT NULL,
    card_brand TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    installment_amount INTEGER NOT NULL,
    total_with_interest INTEGER NOT NULL,
    fee_cents INTEGER NOT NULL,
    net_amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)
await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS transactions_card_last4_status_created_at_idx ON transactions(card_last4, status, created_at)')
await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status)')

export default prisma
