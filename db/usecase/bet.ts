import db, { bets } from '@db'
import { and, count, desc, eq, isNull, lte, or } from 'drizzle-orm'
import type { Connection } from '@solana/web3.js'
import { withPagination } from './utils'
import { dayjs } from '@/lib/utils'
import { getBetDerivedAccount } from '@/lib/solana'

export async function settleBets(conn: Connection, settleBet: (conn: Connection, bet: typeof bets.$inferSelect) => Promise<void>) {
  console.info('📔 Loading Unsettled bets...')
  const unSettledBets = await db.select().from(bets).where(and(
    lte(bets.startedAt, dayjs().toDate()),
    lte(bets.scheduledDrawingAt, dayjs().toDate()),
    or(
      eq(bets.status, 'pending'),
      eq(bets.status, 'error'),
    ),
    isNull(bets.closedAt),
  ))
  console.info('📔 Unsettled bets length:', unSettledBets.length)
  for await (const bet of unSettledBets) {
    await settleBet(conn, bet)
  }
  return unSettledBets.length
}

export async function getBets(page: number, limit: number) {
  const items = withPagination(db.select().from(bets).orderBy(desc(bets.startedAt)).$dynamic(), page, limit)
  return {
    items: await items,
    count: await db.select({ count: count() }).from(bets).then(it => it.at(0)?.count ?? 0),
  }
}

export async function createBet({ startedAt, scheduledDrawingAt }: { startedAt: string, scheduledDrawingAt: string }) {
  const result = await db.transaction(async ($db) => {
    const id = await $db.insert(bets).values({
      startedAt: dayjs(startedAt).toDate(),
      scheduledDrawingAt: dayjs(scheduledDrawingAt).toDate(),
    }).returning({ id: bets.id }).then(it => it.at(0)?.id)
    if (id === undefined)
      throw new Error('create bet failed')
    const keypair = await getBetDerivedAccount(id)
    await $db.update(bets).set({
      fundingAccount: keypair.publicKey.toBase58(),
    }).where(eq(bets.id, id))
    return id
  })
  return result
}

export async function deleteBet(id: number) {
  return (await db.delete(bets).where(eq(bets.id, id))).rowCount ?? 0
}
