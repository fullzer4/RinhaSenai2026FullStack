import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../../data.db')

// Configuração única de WAL mode e busy timeout para concorrência
// Usamos uma conexão separada apenas para configurar os PRAGMAs.
// WAL mode persiste no arquivo do banco, então as conexões seguintes herdam.
const setupClient = createClient({ url: `file:${dbPath}` })
await setupClient.execute('PRAGMA journal_mode=WAL')
await setupClient.execute('PRAGMA busy_timeout=5000')
setupClient.close()

const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

export default prisma