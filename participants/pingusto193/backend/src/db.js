import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client.ts'

const adapter = new PrismaLibSql({ url: 'file:../data.db' })
const prisma = new PrismaClient({ adapter })

// Necessario para a escrita concorrente do stress test: WAL evita bloqueio entre
// leituras e escritas, e busy_timeout faz o SQLite esperar em vez de retornar
// SQLITE_BUSY quando duas escritas colidem.
await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL')
await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000')

export default prisma
