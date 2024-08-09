import { wagers } from '@schema'
import { createInsertSchema } from 'drizzle-zod'

export const betMemoProgramSchema = createInsertSchema(wagers).pick({
  betId: true,
  prediction: true,
  token: true,
})
