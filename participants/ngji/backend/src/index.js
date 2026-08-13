import { join } from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import routes from './routes/transactions.js'

const app = Fastify({ logger: false })

app.register(routes, { prefix: '/api' })

app.register(fastifyStatic, {
  root: join(import.meta.dirname, '../../frontend/dist'),
  wildcard: false,
})

app.get('/*', (req, reply) => reply.sendFile('index.html'))

await app.listen({ port: 3000, host: '0.0.0.0' })
