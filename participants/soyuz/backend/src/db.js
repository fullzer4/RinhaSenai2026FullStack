import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '../generated/prisma/client.ts'

const dbUrl = 'file:../data.db'
export const libsql = createClient({ url: dbUrl })

await libsql.execute('PRAGMA journal_mode = WAL')
await libsql.execute('PRAGMA busy_timeout = 5000')
await libsql.execute('PRAGMA synchronous = NORMAL')
await libsql.execute(`
  CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "card_last4" TEXT NOT NULL,
    "card_brand" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "installment_amount" INTEGER NOT NULL,
    "total_with_interest" INTEGER NOT NULL,
    "fee_cents" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TEXT NOT NULL,
    "refundedAt" DATETIME,
    "idempotencyKey" TEXT
  )
`)
await libsql.execute('CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey")')
await libsql.execute('CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status")')
await libsql.execute('CREATE INDEX IF NOT EXISTS "transactions_card_last4_idx" ON "transactions"("card_last4")')
await libsql.execute('CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions"("created_at")')

await libsql.execute(`
  DELETE FROM "transactions"
  WHERE "idempotencyKey" LIKE 'bench-%'
     OR "idempotencyKey" LIKE 'stress-%'
     OR "idempotencyKey" LIKE 'idem-stress-%'
     OR "idempotencyKey" LIKE 'burst-%'
`)

const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

export default prisma
