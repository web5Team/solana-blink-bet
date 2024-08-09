import process from 'node:process'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { WebSocket } from 'undici'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { bets, dictionary, wagers } from './schema'

export * from './schema'
export * from './usecase'

neonConfig.webSocketConstructor = WebSocket

export const schema = {
  dictionary,
  bets,
  wagers,
} as const

const pool = new Pool({ connectionString: process.env.NEXT_DATABASE_URL })
const db = drizzle(pool, {
  schema,
  // logger: process.env.NODE_ENV === 'development',
})

export default db
