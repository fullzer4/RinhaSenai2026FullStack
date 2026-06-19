import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client.ts'

const adapter = new PrismaLibSql({ url: 'file:../data.db' })
const prisma = new PrismaClient({ adapter })

export default prisma
