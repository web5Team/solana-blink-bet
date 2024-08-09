'use server'

import { createBet, deleteBet, getBets, getWagers, settleBets } from '@db'
import type { PaginationState } from '@tanstack/react-table'
import { createBetActionSchema } from './schema'
import { getConnection } from '@/lib/solana'
import { settleBet } from '@/lib/bet'
import { assertAuth } from '@/auth'

export async function getWagersAction(pagination: PaginationState) {
  return await getWagers(pagination)
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

export async function settleForSomeOneAction(id: number) {
  await assertAuth()
  // TODO:
}
