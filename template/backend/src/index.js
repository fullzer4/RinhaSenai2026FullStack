import path from 'path'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import routes from './routes/transactions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fastify = Fastify({ logger: true })

// API
fastify.register(routes, { prefix: '/api' })

// Frontend (build do Vite)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../frontend/dist'),
  wildcard: false,
})

// SPA fallback
fastify.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Rota nao encontrada' })
  } else {
    reply.sendFile('index.html')
  }
})

await fastify.listen({ port: 3000, host: '0.0.0.0' })
