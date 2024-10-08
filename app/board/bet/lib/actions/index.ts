'use server'

import db, { bets, createBet, deleteBet, getBets, getWagers, retrySettleBet, settleBets } from '@db'
import type { PaginationState } from '@tanstack/react-table'
import { eq } from 'drizzle-orm'
import { createBetActionSchema } from './schema'
import { getConnection } from '@/lib/solana'
import { settleBet } from '@/lib/bet'
import { assertAuth } from '@/auth'
import { syncWagersToDatabase } from '@/lib/bet/wager'

export async function getWagersAction(betId: number, pagination: PaginationState) {
  return await getWagers(betId, pagination)
}

export async function getBetsAction(page: number = 1, limit: number = 10) {
  return await getBets(page, limit)
}

export async function createBetAction(form: { startedAt: string, scheduledDrawingAt: string }) {
  await assertAuth()
  return await createBet(createBetActionSchema.parse(form))
}

export async function deleteBetAction(id: number) {
  await assertAuth()
  return await deleteBet(id)
}

export async function settleAllBetsAction() {
  await assertAuth()
  const conn = getConnection()
  return await settleBets(
    conn,
    settleBet,
  )
}

/**
 * settle bet even if it's successful
 * @param id bet id
 * @returns void
 */
export async function retrySettleBetAction(id: number) {
  await assertAuth()
  return await retrySettleBet(getConnection(), id, settleBet)
}

export async function settleForSomeOneAction(_id: number) {
  await assertAuth()
  throw new Error('Not implemented')
  // TODO:
}

export async function syncWagersToDatabaseAction(betId: number) {
  await assertAuth()
  const bet = await db.select().from(bets).where(eq(bets.id, betId)).limit(1).then(result => result.at(0))
  if (!bet)
    throw new Error('Bet not found')
  return await syncWagersToDatabase(getConnection(), bet, false)
}
