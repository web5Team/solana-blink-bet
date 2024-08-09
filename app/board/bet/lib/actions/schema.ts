import { z } from 'zod'
import { dayjs } from '@/lib/utils'

export const createBetActionSchema = z.object({
  startedAt: z.string().refine(date => !dayjs(date).isBefore(dayjs()), { message: 'Date must be in the future' }),
  scheduledDrawingAt: z.string(),
})
