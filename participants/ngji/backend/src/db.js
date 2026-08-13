import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '../generated/prisma/client.ts'

const libsql = createClient({ url: 'file:../data.db' })

await libsql.execute('PRAGMA journal_mode = WAL')
await libsql.execute('PRAGMA busy_timeout = 5000')
await libsql.execute('PRAGMA synchronous = NORMAL')

const adapter = new PrismaLibSql(libsql)
const prisma = new PrismaClient({ adapter })

export default prisma
export { libsql }
