// @vitest-environment node

/* eslint-disable node/prefer-global/buffer */
import { describe, expect, it, vi } from 'vitest'
import { type Connection, type GetProgramAccountsResponse, PublicKey, Transaction, type TransactionInstruction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js'
import type { wagers } from '@schema'
import BigNumber from 'bignumber.js'
import { createAssociatedTokenAccountIdempotentInstruction, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token'
import { getBetDerivedAccount, getBetRootFundingAccount, getConnection, getPriorityFeeInstruction } from '../solana'
import { MUSHU_MINT } from './MUSHU'
import { calculateProfit } from './profit'

// describe('bet/settle getIsEven', () => {
//   it('should odd', async () => {
//     const conn = getConnection()
//     const isEven = getIsEven(conn, 313262488)
//     expect(isEven).toBeTruthy()
//   })
// })

describe('bet/settle transfer out', () => {
  it('should transfer out MUSHU', {
    timeout: 0,
  }, async () => {
    const conn = getConnection('confirmed')
    const [root] = await getBetRootFundingAccount()
    const funding = await getBetDerivedAccount(2)
    console.info('funding', funding.publicKey.toBase58())
    // const fromAccount = await getAssociatedTokenAddress(mint, funding.publicKey)
    // const toAccount = await getAssociatedTokenAddress(mint, new PublicKey('4nKiPKGKbQa2NNDspNU2E15pGfKVbBeJJqe3v83msT5o'))
    const from = await getAssociatedTokenAddress(MUSHU_MINT, root.publicKey)
    const to = await getAssociatedTokenAddress(MUSHU_MINT, funding.publicKey)

    const ins: TransactionInstruction[] = [
      ...(await getPriorityFeeInstruction(conn)),
      createAssociatedTokenAccountIdempotentInstruction(
        root.publicKey,
        to,
        funding.publicKey,
        MUSHU_MINT,
      ),
      createTransferInstruction(
        from,
        to,
        root.publicKey,
        BigInt(10000000000),
      ),
    ]

    const latestBlockhash = await conn.getLatestBlockhash({ commitment: 'confirmed' })
    const msgV0 = new TransactionMessage({
      instructions: ins,
      recentBlockhash: latestBlockhash.blockhash,
      payerKey: root.publicKey,
    })
    // console.info('signature:', bs58.encode(trx.signature!))
    const result = await conn.simulateTransaction(new VersionedTransaction(msgV0.compileToLegacyMessage()))
    // const signature = await conn.sendRawTransaction(
    //   trx.serialize(),
    // )
    // console.info('result', result.value.err)
    expect(result.value.err).toBeNull()
    const trx = new Transaction({
      ...latestBlockhash,
      feePayer: root.publicKey,
    })
    trx.add(...ins)
    trx.sign(root)
    const signature = await sendAndConfirmTransaction(conn, trx, [root])
    console.info('signature:', signature)

    // expect(signature).eq(bs58.encode(trx.signature!))
  })
})

// describe('bet/settle params', () => {
//   // 测试 解析参数
//   // const fundingAccount = new PublicKey('8qGkC4d1ofrcXH8KemwHQDJyk419HXkdDzjBkZNP12G5')

//   it('should get parsed transactions', async () => {
//     const conn = getConnection()
//     const trx = await conn.getParsedTransaction('2ZUScoLqSrthJpAk5HJRFAfmDaRwNCVGQKsREjPU8nwFvo3CbkLEBgQ9ckauj95pdZ8nMTtB7xiq93cgLv2ttDkP')
//     expect(trx).toBeDefined()
//   })
// })

describe('bet/settle calc', () => {
  const myself = new PublicKey('4nKiPKGKbQa2NNDspNU2E15pGfKVbBeJJqe3v83msT5o')
  const getConn = (hasMEMENFT = false) => ({
    getTokenAccountsByOwner: vi.fn(() => {
      return {
        value: hasMEMENFT
          ? [{
            account: {
              executable: false,
              owner: myself,
              lamports: 1,
              data: Buffer.from([]),
            },
            pubkey: myself,
          }] satisfies GetProgramAccountsResponse
          : [],
      }
    }),
  } as unknown as Connection)

  const winner1 = {
    id: 1,
    userAddress: myself.toBase58(),
    token: 'SOL',
    amount: '100',
  } satisfies Partial<typeof wagers.$inferSelect> as unknown as typeof wagers.$inferSelect

  const winner2 = {
    id: 2,
    userAddress: myself.toBase58(),
    token: 'SOL',
    amount: '250',
  } satisfies Partial<typeof wagers.$inferSelect> as unknown as typeof wagers.$inferSelect

  const winner3 = {
    id: 3,
    userAddress: myself.toBase58(),
    token: 'MUSHU',
    amount: '400',
  } satisfies Partial<typeof wagers.$inferSelect> as unknown as typeof wagers.$inferSelect

  it('calculate winner settle', async () => {
    const loserAmountPool = BigNumber(400)
    const winnerAmountPool = BigNumber(-winner1.amount + -winner2.amount + -winner3.amount).negated()
    const totalAmountPool = BigNumber(winnerAmountPool.plus(loserAmountPool))
    // total amount pool = 1150

    expect(winnerAmountPool.toNumber()).eq(750)
    expect(loserAmountPool.toNumber()).eq(400)
    expect(totalAmountPool.toNumber()).eq(1150)

    // 100 / 750 = 0.13333333333333333
    // 250 / 750 = 0.3333333333333333
    // 400 / 750 = 0.5333333333333333
    // 0.13333333333333333 + 0.3333333333333333 + 0.5333333333333333 = 1

    // 0.13333333333333333 * 400 = 53.33333333333333
    // 53.33333333333333 + 100 = 153.33333333333333

    const reward1 = await calculateProfit(getConn(false), winner1, totalAmountPool, loserAmountPool)
    const reward2 = await calculateProfit(getConn(true), winner2, totalAmountPool, loserAmountPool)
    const reward3 = await calculateProfit(getConn(false), winner3, totalAmountPool, loserAmountPool)

    // console.info(reward1.toString())

    const expectReward1 = BigNumber(153).minus(BigNumber(153).times(0.1)).integerValue(BigNumber.ROUND_DOWN).toNumber()

    expect(reward1.toNumber()).eq(expectReward1)
    expect(reward2.toNumber()).eq(383)
    expect(reward3.toNumber()).eq(613)

    expect(reward1.plus(reward2).plus(reward3).toNumber()).eq(1133)
  })
})
