import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const dbPath = resolve(fileURLToPath(new URL('../../data.db', import.meta.url)))
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('busy_timeout = 10000')
db.pragma('synchronous = NORMAL')
db.pragma('temp_store = MEMORY')
db.pragma('cache_size = -20000')

db.exec(`
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS transactions_card_last4_status_created_at_idx
    ON transactions(card_last4, status, created_at);

  CREATE INDEX IF NOT EXISTS transactions_status_idx
    ON transactions(status);

  CREATE INDEX IF NOT EXISTS transactions_created_at_idx
    ON transactions(created_at);
`)

export default db
