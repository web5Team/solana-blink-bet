import { getBettingActionConfigAction } from '@/board/blink-config/lib/actions'

export async function GET(_req: Request) {
  return Response.json(await getBettingActionConfigAction())
}
