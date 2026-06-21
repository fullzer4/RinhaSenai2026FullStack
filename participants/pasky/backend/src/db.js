import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '../generated/prisma/client.js'

const libsql = createClient({ url: 'file:../data.db' })
const adapter = new PrismaLibSql(libsql)
const prisma = new PrismaClient({ adapter })

export default prisma
