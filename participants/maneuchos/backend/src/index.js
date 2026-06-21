import 'dotenv/config';
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fs from 'node:fs'
import { extname } from 'node:path'
import prisma from './db.js'
import routes from './routes/transactions.js'

const app = Fastify({ logger: true })

app.register(routes, { prefix: '/api' })

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distRoot = join(__dirname, '../../frontend/dist')

app.get('/assets/*', (req, reply) => {
  try {
    const rel = req.url.replace(/^\/assets\//, '')
    const filePath = join(distRoot, 'assets', rel)
    if (!fs.existsSync(filePath)) return reply.code(404).send({ message: 'Not found' })
    const ext = extname(filePath)
    if (ext === '.js') reply.type('application/javascript')
    else if (ext === '.css') reply.type('text/css')
    else if (ext === '.html') reply.type('text/html')
    else reply.type('application/octet-stream')
    const data = fs.readFileSync(filePath)
    return reply.send(data)
  } catch (err) {
    req.log.error(err)
    return reply.code(500).send({ message: 'Error reading asset' })
  }
})

app.get('/*', (req, reply) => {
  const indexPath = join(distRoot, 'index.html')
  if (fs.existsSync(indexPath)) return reply.type('text/html').send(fs.readFileSync(indexPath))
  return reply.code(404).send({ message: 'Not Found' })
})

await app.listen({ port: 3000, host: '0.0.0.0' })
