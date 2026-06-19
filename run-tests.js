#!/usr/bin/env node
/**
 * Script wrapper para rodar os testes com banco limpo.
 * Uso: node run-tests.js
 * 
 * Este script:
 * 1. Chama DELETE /api/reset para limpar o banco
 * 2. Executa node tests/run.js
 */
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 1. Reset do banco via API
try {
  const res = await fetch('http://localhost:3000/api/reset', { method: 'DELETE' })
  if (res.ok) {
    console.log('✔ Banco resetado com sucesso')
  } else {
    console.warn('⚠ Reset retornou status:', res.status)
  }
} catch (e) {
  console.error('✖ Servidor nao esta rodando! Suba o servidor antes: node template/backend/src/index.js')
  process.exit(1)
}

// 2. Rodar os testes
try {
  execSync(`node ${join(__dirname, 'tests', 'run.js')}`, { stdio: 'inherit' })
} catch {
  process.exit(1)
}
