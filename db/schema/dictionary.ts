import { jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { defaultFields } from './default'

export const dictionary = pgTable('dictionary', {
  ...defaultFields,
  key: text('key').notNull().unique(),
  value: jsonb('value'),
})
