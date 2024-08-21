/* eslint-disable node/prefer-global/buffer */
import { MEMO_PROGRAM_ID } from '@solana/actions'
import { createAssociatedTokenAccountIdempotentInstruction, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token'
import { type Connection, type Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js'
import type BigNumber from 'bignumber.js'
import bs58 from 'bs58'
import { getConnection, getPriorityFeeInstruction } from '../solana'
import { MUSHU_MINT } from './MUSHU'

export async function transferProfit(
  fundingAccount: Keypair,
  token: 'SOL' | 'MUSHU',
  amount: BigNumber,
  recipient: PublicKey,
  abortSignal?: AbortSignal,
) {
  const conn = getConnection()
  const ins: TransactionInstruction[] = await createInstruction(conn, token, fundingAccount, recipient, amount)
  const latestBlockhash = await conn.getLatestBlockhash()

  await simulateTransaction(conn, ins, latestBlockhash, fundingAccount.publicKey)

  const transaction = new Transaction({
    ...latestBlockhash,
  }).add(...ins)

  transaction.sign(fundingAccount)

  return [
    bs58.encode(transaction.signature!),
    async () => {
      return await sendAndConfirmTransaction(
        conn,
        transaction,
        [fundingAccount],
        {
          maxRetries: 10,
          commitment: 'confirmed',
          abortSignal,
        },
      )
    },
  ] as const
}

async function createInstruction(
  conn: Connection,
  token: string,
  fundingAccount: Keypair,
  recipient: PublicKey,
  amount: BigNumber,
) {
  const ins: TransactionInstruction[] = [
    ...(await getPriorityFeeInstruction(conn)),
  ]

  if (token === 'SOL') {
    // console.info('📔 Transfer profit SOL from ', fundingAccount.publicKey.toBase58(), 'to', recipient.toBase58(), 'lamports', amount.toNumber())
    ins.push(SystemProgram.transfer({
      fromPubkey: fundingAccount.publicKey,
      toPubkey: recipient,
      lamports: amount.toNumber(),
    }))
  }
  else if (token === 'MUSHU') {
    // transaction.add(SystemProgram.)
    const MINT = new PublicKey(MUSHU_MINT)
    const fromAccount = await getAssociatedTokenAddress(MINT, fundingAccount.publicKey, true)
    const toAccount = await getAssociatedTokenAddress(MINT, recipient, true)
    ins.push(
      createAssociatedTokenAccountIdempotentInstruction(
        fundingAccount.publicKey,
        toAccount,
        recipient,
        MUSHU_MINT,
      ),
      createTransferInstruction(
        fromAccount,
        toAccount,
        fundingAccount.publicKey,
        BigInt(amount.toString()),
      ),
    )
  }

  ins.push(new TransactionInstruction({
    keys: [{ pubkey: fundingAccount.publicKey, isSigner: true, isWritable: true }],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(`You won the bet, and here are the tokens you earned.`),
  }))
  return ins
}

async function simulateTransaction(
  conn: Connection,
  ins: TransactionInstruction[],
  latestBlockhash: Readonly<{ blockhash: string, lastValidBlockHeight: number }>,
  payer: PublicKey,
) {
  const simulated = await conn.simulateTransaction(
    new VersionedTransaction(
      new TransactionMessage({
        instructions: ins,
        recentBlockhash: latestBlockhash.blockhash,
        payerKey: payer,
      }).compileToLegacyMessage(),
    ),
    { commitment: 'confirmed', replaceRecentBlockhash: true },
  )

  // console.info('simulated result:', simulated.value)

  if (simulated.value.err) {
    if (typeof simulated.value.err === 'string')
      throw new Error(simulated.value.err)
    if ('InstructionError' in simulated.value.err) {
      const [instructionIndex, errorDetails] = simulated.value.err.InstructionError as any
      if (typeof errorDetails === 'object') {
        const errorType = Object.keys(errorDetails)[0]
        const errorValue = errorDetails[errorType]
        throw new Error(`Error in instruction: ${instructionIndex} details: ${errorType}_${errorValue}`)
      }
      throw new Error(`Error in instruction: ${instructionIndex} details: ${errorDetails}`)
    }
  }
}
