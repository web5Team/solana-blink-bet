import { serial, timestamp } from 'drizzle-orm/pg-core'

export const defaultFields = {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true })
    .notNull()
    .defaultNow(),
} as const
