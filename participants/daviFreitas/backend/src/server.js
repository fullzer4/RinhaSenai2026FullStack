import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initDatabase, closeDatabase } from './db/client.js';
import transactionsRoutes from './routes/transactions.js';
import balanceRoutes from './routes/balance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
const PORT = process.env.PORT || 3000;

const app = Fastify({ logger: false });

app.register(transactionsRoutes, { prefix: '/api' });
app.register(balanceRoutes, { prefix: '/api' });

app.get('/api/health', async () => ({ status: 'ok' }));

app.addHook('onClose', async () => {
  await closeDatabase();
});

// Serve o build do React (gerado por `npm run build`)
if (fs.existsSync(FRONTEND_DIST)) {
  app.register(fastifyStatic, {
    root: FRONTEND_DIST,
    wildcard: false,
  });

  // Fallback de SPA: qualquer rota que nao seja /api/* devolve o index.html,
  // para as rotas do React Router (/, /history, /transaction/:id) funcionarem
  // mesmo em reload direto da pagina.
  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url && request.raw.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'not_found' });
      return;
    }
    reply.sendFile('index.html');
  });
} else {
  app.log?.warn?.('frontend/dist nao encontrado - rode "npm run build" antes de "npm start"');
}

async function start() {
  try {
    await initDatabase();
    const address = await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Servidor rodando em ${address}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
