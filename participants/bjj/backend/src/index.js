import { join } from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import routes from './routes/transactions.js'
import { configurePragmas } from './db.js'

// Aplica os PRAGMAs de concorrencia (WAL, busy_timeout, synchronous=NORMAL)
// antes de aceitar qualquer requisicao. Isso evita uma janela inicial onde
// o banco ainda estaria no modo journal padrao (mais lento e mais propenso
// a "database is locked" sob concorrencia).
await configurePragmas()

const app = Fastify({
  logger: { level: 'warn' }, // info/debug custam throughput sob stress test; mantemos so warn/error
  disableRequestLogging: true,
  keepAliveTimeout: 30000,
  bodyLimit: 1048576, // 1MB e suficiente para o payload de transacao; evita alocacoes excessivas
})

app.setErrorHandler((err, req, reply) => {
  // JSON malformado no body deve ser tratado como dados invalidos (422),
  // nao como erro interno.
  if (err instanceof SyntaxError || err.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
    return reply.code(422).send({ error: 'invalid_json' })
  }
  req.log.error(err)
  if (!reply.sent) {
    reply.code(err.statusCode || 500).send({ error: 'internal_error' })
  }
})

app.register(routes, { prefix: '/api' })

app.register(fastifyStatic, {
  root: join(import.meta.dirname, '../../frontend/dist'),
  wildcard: false,
})

// SPA fallback: qualquer rota nao-API e nao-asset cai no index.html,
// permitindo deep linking (ex: /history?page=2, /transaction/:id).
app.get('/*', (req, reply) => reply.sendFile('index.html'))

await app.listen({ port: 3000, host: '0.0.0.0' })
console.log('Servidor rodando em http://localhost:3000')
