import db, { bets, wagers } from '@db'
import { type Connection, type Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { and, eq, ne } from 'drizzle-orm'
import { parseUnknownError } from '@utils'
import BigNumber from 'bignumber.js'
import { getBetDerivedAccount, getBetRootFundingAccount, getConnection } from '../solana'
import { syncWagersToDatabase } from './wager'
import { transferProfit } from './transfer-profit'
import { calculateProfit } from './profit'

async function sendSettlementTransaction() {
  const conn = getConnection('confirmed')
  const latestBlockhash = await conn.getLatestBlockhash()
  const [root] = await getBetRootFundingAccount()
  const transaction = new Transaction({
    ...latestBlockhash,
    feePayer: root.publicKey,
  })
  transaction.add(SystemProgram.transfer({
    fromPubkey: root.publicKey,
    toPubkey: root.publicKey,
    lamports: 1,
  }))
  transaction.sign(root)
  return await sendAndConfirmTransaction(conn, transaction, [root])
}

export async function settleBet(
  conn: Connection,
  bet: typeof bets.$inferSelect,
  forceReload = false,
) {
  try {
    let betSettlementSignature = bet.settlementSignature
    let betResult = bet.result
    if (!betSettlementSignature || !betResult) {
      console.info(`📔 Bet ID: ${bet.id} Settlement signature not found, sending a new transaction for settlement...`)
      const signature = await sendSettlementTransaction()
      betSettlementSignature = signature
      betResult = getIsEven(betSettlementSignature) ? 'even' : 'odd'
      console.info(`📔 Bet ID: ${bet.id} Settlement signature sent, bet result: ${betResult}, signature: ${betSettlementSignature}`)

      await db.update(bets).set({
        settlementSignature: betSettlementSignature,
        result: betResult,
      }).where(eq(bets.id, bet.id))
    }
    else {
      console.info(`📔 Bet ID: ${bet.id} Settlement signature already exists, bet result: ${betResult}, signature: ${betSettlementSignature}`)
    }
    const fundingAccount = await getBetDerivedAccount(bet.id)
    console.info('📔 Bet ID:', bet.id, 'Funding account bs58:', fundingAccount.publicKey.toBase58())

    // 首先载入参与者到数据库
    if (!bet.wagerLoaded || forceReload) {
      console.info('📔 Syncing wagers to Database...')
      const rowCount = await syncWagersToDatabase(conn, bet)
      console.info('✅ All wagers synced to Database, length: ', rowCount)
    }

    // 再结算
    await db.transaction(async ($tx) => {
      await $tx.update(bets).set({
        closedAt: new Date(),
        result: betResult,
        status: 'success',
        settlementError: null,
        settlementSignature: betSettlementSignature,
      }).where(eq(bets.id, bet.id))

      const allSOLWagers = await $tx.select().from(wagers).where(and(
        eq(wagers.betId, bet.id),
        eq(wagers.token, 'SOL'),
      ))
      console.info('📔 All sol wagers:', allSOLWagers.length)
      // console.info('📔 All sol wagers:', allSOLWagers.map(wager => wager.userAddress))
      await winnersSettleForToken(
        conn,
        bet.id,
        fundingAccount,
        allSOLWagers,
        'SOL',
        betResult === 'even',
      )

      const allMUSHUWagers = await $tx.select().from(wagers).where(and(
        eq(wagers.betId, bet.id),
        eq(wagers.token, 'MUSHU'),
      ))
      console.info('📔 All mushu wagers:', allMUSHUWagers.length)
      // console.info('📔 All mushu wagers:', allMUSHUWagers.map(wager => wager.userAddress))
      await winnersSettleForToken(
        conn,
        bet.id,
        fundingAccount,
        allMUSHUWagers,
        'MUSHU',
        betResult === 'even',
      )
    // 都处理完成 事务成功提交
    })
  }
  catch (err: any) {
    await db.update(bets).set({
      status: 'error',
      settlementError: parseUnknownError(err),
    }).where(eq(bets.id, bet.id))
    throw err
  }
}

async function winnersSettleForToken(
  conn: Connection,
  betId: number,
  fundingAccount: Keypair,
  allWagers: (typeof wagers.$inferSelect)[],
  token: 'SOL' | 'MUSHU',
  isEven: boolean,
) {
  const oddWagers = allWagers.filter(wager => wager.prediction === 'odd')
  const evenWagers = allWagers.filter(wager => wager.prediction === 'even')

  const oddAmount = oddWagers.reduce((acc, wager) => acc.plus(BigNumber(wager.amount)), BigNumber(0))
  const evenAmount = evenWagers.reduce((acc, wager) => acc.plus(BigNumber(wager.amount)), BigNumber(0))
  const totalAmountPool = oddAmount.plus(evenAmount)

  const unsettledOddWagers = oddWagers.filter(wager => wager.status !== 'success')
  const unsettledEvenWagers = evenWagers.filter(wager => wager.status !== 'success')

  const unsettledWinners = isEven ? unsettledEvenWagers : unsettledOddWagers
  const loserAmountPool = isEven ? oddAmount : evenAmount

  console.info('📔 Token', token, 'Unsettled winners length:', unsettledWinners.length)

  // 先更新losers的状态
  await db.update(wagers).set({
    status: 'success',
    profit: '0',
  }).where(and(
    eq(wagers.betId, betId),
    ne(wagers.status, 'success'),
    eq(wagers.prediction, isEven ? 'odd' : 'even'),
  ))

  // 再分别在新的事务中发送奖励
  for await (const unsettledWinner of unsettledWinners) {
    await winnerSettle(
      conn,
      fundingAccount,
      token,
      unsettledWinner,
      totalAmountPool,
      loserAmountPool,
    )
  }
}

/**
 *
 * @param conn 连接
 * @param fundingAccount 资金账户
 * @param token 奖励的token
 * @param winner 胜者
 * @param totalAmountPool 总奖池 赢家和输家们的钱
 * @param loserAmountPool 输家们的钱 赢家将瓜分它们
 */
export async function winnerSettle(
  conn: Connection,
  fundingAccount: Keypair,
  token: 'SOL' | 'MUSHU',
  winner: typeof wagers.$inferSelect,
  totalAmountPool: BigNumber,
  loserAmountPool: BigNumber,
) {
  await db.transaction(async ($innerTx) => {
    // 扣除手续费 如果用meme token投注，则不扣除手续费，如果钱包里有 [2DMMamkkxQ6zDMBtkFp8KH7FoWzBMBA1CGTYwom4QH6Z] 也不扣除手续费
    try {
      const profit = await calculateProfit(conn, winner, totalAmountPool, loserAmountPool)
      console.info('📔 Transfer profit to winner:', winner.userAddress, 'token:', token, 'amount:', profit.toString())
      const [signature, sendAndConfirm] = await transferProfit(
        fundingAccount,
        token,
        profit,
        new PublicKey(winner.userAddress),
      )

      // 先update 再发送交易，以免update失败无法回滚交易
      await $innerTx.update(wagers).set({
        status: 'success',
        profit: profit.toString(),
        profitSignature: signature,
      }).where(eq(wagers.id, winner.id))

      const actualSignature = await sendAndConfirm()
      console.info('✅ Transfer profit to winner success:', winner.userAddress, 'token:', token, 'amount:', profit.toString(), 'actual signature:', actualSignature)
    }
    catch (err: any) {
      await $innerTx.update(wagers).set({
        status: 'error',
        settlementError: parseUnknownError(err),
      })
      throw err
    }
  })
}

export function getIsEven(hash: string) {
  console.info('📔 Get is even:', hash, hash.charCodeAt(hash.length - 1))
  return hash.charCodeAt(hash.length - 1) % 2 === 0
}
