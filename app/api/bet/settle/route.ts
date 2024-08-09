import { settleBets } from '@db'
import { NextResponse } from 'next/server'
import { settleBet } from '@/lib/bet'
import { getConnection } from '@/lib/solana'
import { auth } from '@/auth'

// 此端口用于处理未结算的bet
export const POST = auth(async (req) => {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!req.auth && secret !== process.env.NEXT_INTERNAL_API_SECRET)
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  const conn = getConnection()
  const len = await settleBets(conn, settleBet)
  return Response.json({
    length: len,
  })
})
