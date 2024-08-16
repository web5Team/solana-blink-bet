/* eslint-disable node/prefer-global/buffer */
import { and, asc, isNull, lte, ne } from 'drizzle-orm'
import { type Connection, type Keypair, LAMPORTS_PER_SOL, type ParsedAccountData, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import type { BetPrediction, BetToken } from '@schema'
import db, { bets } from '@db'
import { type ActionPostResponse, MEMO_PROGRAM_ID } from '@solana/actions'
import BigNumber from 'bignumber.js'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { dayjs } from '@/lib/utils'
import { getBetDerivedAccount, getConnection, getPriorityFeeInstruction } from '@/lib/solana'
import { MUSHU_MINT } from '@/lib/bet/MUSHU'

export async function POST(_req: Request) {
  try {
    const url = new URL(_req.url)
    const plan = Number(url.searchParams.get('plan'))
    if (![0, 1, 2, 3].includes(plan)) {
      throw new Error('Invalid plan')
    }
    const { account } = await _req.json()
    if (!account) {
      throw new Error('Account is required')
    }
    const user = new PublicKey(account)
    let selectedPlan!: {
      amount: number
      token: typeof BetToken.enumValues[number]
      prediction: typeof BetPrediction.enumValues[number]
    }

    switch (plan) {
      case 0:
        selectedPlan = {
          amount: 0.001,
          token: 'SOL',
          prediction: 'odd',
        }
        break
      case 1:
        selectedPlan = {
          amount: 0.001,
          token: 'SOL',
          prediction: 'even',
        }
        break
      case 2:
        selectedPlan = {
          amount: 5,
          token: 'MUSHU',
          prediction: 'odd',
        }
        break
      case 3:
        selectedPlan = {
          amount: 5,
          token: 'MUSHU',
          prediction: 'even',
        }
        break
    }

    // TODO: 寻找最近的一个 今天之后的 未结束的，结算区块在最新区块后面的
    const bet = await db.select().from(bets)
      .orderBy(asc(bets.startedAt))
      .where(and(
        lte(bets.startedAt, dayjs().toDate()),
        ne(bets.status, 'success'),
        isNull(bets.result),
      ))
      .limit(1).then(result => result.at(0))

    if (!bet) {
      throw new Error('No bet started for now.')
    }

    const conn = getConnection()
    const blockhash = await conn.getLatestBlockhash()
    const fundingAccount = await getBetDerivedAccount(bet.id)
    console.info('bet', bet.id, 'funding account bs58:', fundingAccount.publicKey.toBase58())
    const trx = new Transaction({
      ...blockhash,
      feePayer: user,
    }).add(...(await getPriorityFeeInstruction(conn)))

    if (selectedPlan.token === 'MUSHU') {
      await createSendMUSHUTrx(getConnection(), trx, fundingAccount, user, selectedPlan)
    }
    else {
      createSendSOLTrx(trx, fundingAccount.publicKey, user, selectedPlan)
    }

    trx
      .add(new TransactionInstruction({
        keys: [{ pubkey: user, isSigner: true, isWritable: true }],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(new URLSearchParams({
          id: bet.id.toString(),
          prediction: selectedPlan.prediction,
          token: selectedPlan.token,
        }).toString()),
      }))

    const trxSerialized = trx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return Response.json({
      transaction: trxSerialized.toString('base64'),
      message: '🏅 Well done!',
    } satisfies ActionPostResponse)
  }
  catch (err: any) {
    console.warn(err)
    return Response.json({
      transaction: '',
      message: err.message,
    } satisfies ActionPostResponse, { status: 404 })
  }
}

async function createSendMUSHUTrx(
  conn: Connection,
  trx: Transaction,
  fundingAccount: Keypair,
  user: PublicKey,
  selectedPlan: { amount: number, token: (typeof BetToken.enumValues)[number], prediction: (typeof BetPrediction.enumValues)[number] },
) {
  const info = await conn.getParsedAccountInfo(MUSHU_MINT)
  const decimals = (info.value?.data as ParsedAccountData)?.parsed.info.decimals as number
  if (!decimals)
    throw new Error('Token Decimals not found')

  const fromAccount = await getAssociatedTokenAddress(
    MUSHU_MINT,
    user,
  )
  console.info('from token account', fromAccount.toBase58())
  const toAccount = await getAssociatedTokenAddress(
    MUSHU_MINT,
    fundingAccount.publicKey,
  )
  console.info('to token account', toAccount.toBase58())
  trx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      user,
      toAccount,
      fundingAccount.publicKey,
      MUSHU_MINT,
    ),
    createTransferInstruction(
      fromAccount,
      toAccount,
      user,
      BigInt(BigNumber(selectedPlan.amount)
        .times(BigNumber(10).pow(decimals))
        .toString()),
    ),
  )
}

function createSendSOLTrx(
  trx: Transaction,
  fundingAccount: PublicKey,
  user: PublicKey,
  selectedPlan: { amount: number, token: (typeof BetToken.enumValues)[number], prediction: (typeof BetPrediction.enumValues)[number] },
) {
  trx
    .add(SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: fundingAccount,
      lamports: BigNumber(selectedPlan.amount)
        .times(LAMPORTS_PER_SOL)
        .integerValue(BigNumber.ROUND_CEIL)
        .toNumber(),
    }))
}
