import prisma from '../db.js'

export default async function (fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get('/balance', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  fastify.post('/transactions', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  fastify.get('/transactions/:id', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  fastify.get('/transactions', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  fastify.post('/transactions/:id/refund', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })
}
