import { PrismaClient } from '@prisma/client';

// Singleton do PrismaClient: uma unica instancia reaproveitada por toda a
// aplicacao, para nao abrir varias conexoes concorrentes com o arquivo SQLite.
export const prisma = new PrismaClient();

let ready = false;

/**
 * Configura o SQLite para aguentar escritas concorrentes:
 *
 * - journal_mode = WAL: leitores nao bloqueiam escritores e vice-versa
 *   (no modo padrao "DELETE", qualquer escrita bloqueia todas as leituras).
 * - busy_timeout: em vez de estourar "database is locked" na hora,
 *   a conexao espera ate N ms pelo lock ser liberado antes de falhar.
 *   Essencial para o teste de stress (20 workers / 200 txns concorrentes).
 * - synchronous = NORMAL: seguro em conjunto com WAL e bem mais rapido
 *   que o padrao FULL, sem risco de corrupcao do banco em caso de crash.
 */
export async function initDatabase() {
  if (ready) return prisma;

  await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');
  await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');

  ready = true;
  return prisma;
}

export async function closeDatabase() {
  await prisma.$disconnect();
}
