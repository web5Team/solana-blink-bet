import type { wagers } from '@schema'
import { type Connection, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export async function calculateProfit(
  conn: Connection,
  winner: typeof wagers.$inferSelect,
  totalAmountPool: BigNumber,
  loserAmountPool: BigNumber,
) {
  const winnerTokenAccounts = await conn.getTokenAccountsByOwner(
    new PublicKey(winner.userAddress),
    { mint: new PublicKey('2DMMamkkxQ6zDMBtkFp8KH7FoWzBMBA1CGTYwom4QH6Z') },
  )
  const hasMEMENFT = winnerTokenAccounts.value.some(({ account }) => account.lamports === 1)
  // 投注比例，即赢得的比例
  const ratio = BigNumber(winner.amount).div(totalAmountPool.minus(loserAmountPool))
  // 赢家的奖励 向下取整
  let reward = ratio.times(loserAmountPool).plus(winner.amount).integerValue(BigNumber.ROUND_DOWN)
  // 手续费逻辑
  if (!hasMEMENFT && winner.token === 'SOL') {
    // 扣除10%手续费
    const tmp = reward
    reward = reward.minus(tmp.times(0.1)).integerValue(BigNumber.ROUND_DOWN)
  }
  return reward
}
