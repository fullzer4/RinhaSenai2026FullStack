import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import routes from './routes/transactions.js'

const frontendRoot = join(import.meta.dirname, '../../frontend/dist')
const indexHtml = readFileSync(join(frontendRoot, 'index.html'), 'utf8')

const app = Fastify({
  logger: false,
  requestTimeout: 0,
  keepAliveTimeout: 72000
})

app.addHook('onRequest', (request, reply, done) => {
  const requestedHeaders = request.headers['access-control-request-headers']

  reply.header('Access-Control-Allow-Origin', request.headers.origin || '*')
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  reply.header('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type')
  reply.header('Access-Control-Max-Age', '86400')
  reply.header('Vary', 'Origin, Access-Control-Request-Headers')

  if (request.headers['access-control-request-private-network'] === 'true') {
    reply.header('Access-Control-Allow-Private-Network', 'true')
  }

  if (request.method === 'OPTIONS') {
    reply.code(204).send()
    return
  }

  done()
})

app.register(routes, { prefix: '/api' })

app.register(fastifyStatic, {
  root: join(frontendRoot, 'assets'),
  prefix: '/assets/'
})

app.get('/*', (req, reply) => {
  reply.type('text/html; charset=utf-8').send(indexHtml)
})

await app.listen({ port: 3000, host: '0.0.0.0' })
