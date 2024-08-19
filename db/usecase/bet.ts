import db, { bets } from '@db'
import { and, count, desc, eq, isNull, lte, or } from 'drizzle-orm'
import { type Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { withPagination } from './utils'
import { dayjs } from '@/lib/utils'
import { getBetDerivedAccount, getBetRootFundingAccount, getConnection } from '@/lib/solana'

export async function settleBets(conn: Connection, settleBet: (conn: Connection, bet: typeof bets.$inferSelect) => Promise<void>) {
  console.info('📔 Loading Unsettled bets...')
  const unSettledBets = await db.select().from(bets).where(and(
    lte(bets.startedAt, dayjs().toDate()),
    lte(bets.scheduledDrawingAt, dayjs().toDate()),
    or(
      eq(bets.status, 'pending'),
      // error status should be exlicitly settled
      // eq(bets.status, 'error'),
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
    const [root] = await getBetRootFundingAccount()

    // transfer SOL to the funding account
    const conn = getConnection()
    const blockhash = await conn.getLatestBlockhash()
    const trx = new Transaction({
      ...blockhash,
      feePayer: root.publicKey,
    })
    trx.add(SystemProgram.transfer({
      fromPubkey: root.publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
      toPubkey: keypair.publicKey,
    }))
    await sendAndConfirmTransaction(conn, trx, [root])

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

export async function retrySettleBet(conn: Connection, id: number, settleBet: (conn: Connection, bet: typeof bets.$inferSelect) => Promise<void>) {
  const bet = await db.select()
    .from(bets)
    .where(and(
      eq(bets.id, id),
      eq(bets.status, 'error'),
    ))
    .limit(1)
    .then(it => it.at(0))
  if (!bet)
    throw new Error('Bet not found')
  return settleBet(conn, bet)
}
