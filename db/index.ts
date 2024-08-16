import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { bets, dictionary, wagers } from './schema'

export * from './schema'
export * from './usecase'

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
