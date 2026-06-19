import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { PrismaClient } from '../generated/prisma/client.js'

const libsql = createClient({ url: 'file:../data.db' })

// --- Configuracao critica de concorrencia do SQLite ---------------------
//
// journal_mode = WAL
//   Permite leitores concorrentes enquanto uma escrita esta em andamento
//   (readers nao bloqueiam writer, writer nao bloqueia readers). Sem isso
//   (modo DELETE/rollback journal padrao) qualquer leitura durante uma
//   escrita esperaria o lock ser liberado.
//
// busy_timeout = 5000
//   Rede de seguranca: se por algum motivo duas conexoes tentarem escrever
//   ao mesmo tempo (ex.: processo de migracao + app, ou multiplas instancias),
//   o SQLite espera ate 5s antes de devolver SQLITE_BUSY, em vez de falhar
//   imediatamente. Com o mutex de aplicacao (lib/mutex.js) isso quase nunca
//   e acionado para escritas vindas do proprio processo, mas protege contra
//   qualquer escrita externa (ex.: prisma db push, sqlite3 CLI, etc).
//
// synchronous = NORMAL
//   Em WAL mode, NORMAL e seguro contra corrupcao (ao contrario do modo
//   rollback journal) e evita o fsync custoso a cada commit que FULL exige.
//   E o trade-off recomendado oficialmente pelo SQLite para WAL: durabilidade
//   forte o suficiente para esse caso de uso, com throughput de escrita muito
//   maior.
//
// wal_autocheckpoint
//   Mantemos o default (1000 paginas) -- e suficiente para nao deixar o
//   arquivo -wal crescer demais durante o stress test, sem gerar checkpoints
//   excessivos que competiriam com escritas.
//
// cache_size = -16000 (16MB)
//   Mais paginas em cache de memoria reduzem I/O de disco em leituras
//   repetidas (paginacao, balance, etc).
//
// temp_store = MEMORY
//   Tabelas/indices temporarios (usados em alguns ORDER BY/COUNT) ficam em
//   RAM em vez de arquivo temporario em disco.
const PRAGMAS = [
  'PRAGMA journal_mode = WAL;',
  'PRAGMA busy_timeout = 5000;',
  'PRAGMA synchronous = NORMAL;',
  'PRAGMA cache_size = -16000;',
  'PRAGMA temp_store = MEMORY;',
  'PRAGMA foreign_keys = OFF;',
]

export async function configurePragmas() {
  for (const pragma of PRAGMAS) {
    await libsql.execute(pragma)
  }
}

const adapter = new PrismaLibSql(libsql)
const prisma = new PrismaClient({ adapter })

export default prisma
export { libsql }
