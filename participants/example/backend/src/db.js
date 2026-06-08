import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configura PRAGMAs do SQLite para performance e concorrencia
try {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000')
  await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL')
  await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY')
} catch (err) {
  console.warn('PRAGMA setup warning:', err.message)
}

export default prisma
