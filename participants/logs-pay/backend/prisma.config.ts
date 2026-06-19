import { defineConfig } from 'prisma/config'

try {
  process.loadEnvFile()
} catch (e) {
  // Ignored
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
