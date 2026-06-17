import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || 'file:../data.db';
const dbPath = path.resolve(__dirname, '../../data.db'); 
const libsql = createClient({ url: `file:${dbPath}` });
const adapter = new PrismaLibSql(libsql)
const prisma = new PrismaClient({ adapter })

export default prisma

import { fileURLToPath } from 'url';
import path from 'path';




