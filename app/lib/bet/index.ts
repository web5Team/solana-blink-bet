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
  const conn = getConnection()
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

    const fundingAccount = await getBetDerivedAccount(bet.id)
    console.info('📔 Now settle Bet ID:', bet.id, 'Funding account bs58:', fundingAccount.publicKey.toBase58(), 'Bet Result:', betResult)

    // Sync to database first
    if (!bet.wagerLoaded || forceReload) {
      console.info('📔 Syncing wagers to Database...')
      const rowCount = await syncWagersToDatabase(conn, bet)
      console.info('✅ All wagers synced to Database, length: ', rowCount)
    }

    // Then settle winners
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
      console.info('📔 All SOL Token wagers:', allSOLWagers.length)
      await settleWinnersForToken(
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
      console.info('📔 All MUSHU Token wagers:', allMUSHUWagers.length)
      await settleWinnersForToken(
        conn,
        bet.id,
        fundingAccount,
        allMUSHUWagers,
        'MUSHU',
        betResult === 'even',
      )
      // Once all processing is complete, the bet is considered settled
    })
  }
  catch (err: any) {
    // If there is an error, update the bet status.
    await db.update(bets).set({
      status: 'error',
      settlementError: parseUnknownError(err),
    }).where(eq(bets.id, bet.id))
    throw err
  }
}

async function settleWinnersForToken(
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

  // resettle unsuccessful wagers
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
    // Deduct the fee. If betting with meme token, no fee is deducted. If the wallet contains [2DMMamkkxQ6zDMBtkFp8KH7FoWzBMBA1CGTYwom4QH6Z], no fee is deducted either.
    try {
      const profit = await calculateProfit(conn, winner, totalAmountPool, loserAmountPool)
      console.info('📔 Transfer profit to winner:', winner.userAddress, 'token:', token, 'amount:', profit.toString())
      const [signature, sendAndConfirm] = await transferProfit(
        fundingAccount,
        token,
        profit,
        new PublicKey(winner.userAddress),
      )

      // Update first, then send the transaction to avoid the inability to roll back the transaction if the update fails.
      await $innerTx.update(wagers).set({
        status: 'success',
        profit: profit.toString(),
        profitSignature: signature,
      }).where(eq(wagers.id, winner.id))

      const actualSignature = await sendAndConfirm()
      console.info('✅ Transfer profit to winner success:', winner.userAddress, 'token:', token, 'amount:', profit.toString(), 'actual signature:', actualSignature)
    }
    catch (err: any) {
      // If there is an error, update the wager status using db instead $innerTx. cause err should log to bet table
      await db.update(wagers).set({
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
