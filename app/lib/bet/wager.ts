import { type Connection, type ParsedInstruction, type ParsedTransactionWithMeta, PublicKey, SystemProgram } from '@solana/web3.js'
import { MEMO_PROGRAM_ID } from '@solana/actions'
import { type Bet, bets, wagers } from '@schema'
import db from '@db'
import { eq } from 'drizzle-orm'
import { fetchTransactions } from '../solana'
import { betMemoProgramSchema } from './schema'

class GetWagerError extends Error {

}

class MemoProgramNotFound extends GetWagerError {
  name: string = 'MemoProgramNotFound'
}

class InvalidMemoProgramParams extends GetWagerError {
  name: string = 'InvalidMemoProgramParams'
}

// class ViolentTransfer extends GetWagerError {
//   name: string = 'ViolentTransfer'
// }

class TransferNotFound extends GetWagerError {
  name: string = 'TransferNotFound'
}

// class ParseError extends Error implements IGetWagerError {}

function getBetParamsFromInstructions(instructions: ParsedInstruction[]) {
  const memoProgram = instructions.find(ins => ins.programId.toBase58() === MEMO_PROGRAM_ID) as ParsedInstruction | undefined
  if (!memoProgram)
    throw new MemoProgramNotFound('Memo program not found in instructions')
  const params = new URLSearchParams(memoProgram.parsed)
  const betId = params.get('id')
  const prediction = params.get('prediction')
  const token = params.get('token')
  if (betId === null || prediction === null || token === null)
    throw new InvalidMemoProgramParams('Invalid memo program params')
  const result = betMemoProgramSchema.safeParse({ betId: Number(betId), prediction, token })
  if (!result.success)
    throw new InvalidMemoProgramParams(result.error.message)
  return result.data
}

function getTransferFromInstructions(instructions: ParsedInstruction[]) {
  let transfer: {
    amount: string
    source: string
  } | null = null
  for (const instruction of instructions) {
    if (instruction.programId.equals(SystemProgram.programId) && instruction.parsed.type === 'transfer') {
      transfer = {
        amount: instruction.parsed.info.lamports.toString(),
        source: instruction.parsed.info.source,
      }
      break
    }
    else if (instruction.program === 'spl-token' && instruction.parsed.type === 'transfer') {
      transfer = {
        amount: instruction.parsed.info.amount,
        source: instruction.parsed.info.authority,
      }
      break
    }
  }
  if (!transfer)
    throw new TransferNotFound('Transfer not found in instructions')
  return transfer
}

function loadWagerFromTransaction(trx: ParsedTransactionWithMeta) {
  const instructions = trx.transaction.message.instructions.filter(ins => 'parsed' in ins)

  const memoProgram = getBetParamsFromInstructions(instructions)
  const transfer = getTransferFromInstructions(instructions)

  return {
    ...memoProgram,
    userAddress: transfer.source,
    amount: transfer.amount,
    blockNumber: trx.slot,
    signature: trx.transaction.signatures.at(0)!,
  } satisfies (typeof wagers.$inferInsert)
}

export async function loadWagersByFundingAccount(conn: Connection, fundingAccount: PublicKey) {
  const trxs = await fetchTransactions({
    address: fundingAccount!,
    limit: Number.MAX_SAFE_INTEGER,
  })
  const loadedWagers = trxs.map((transaction) => {
    try {
      return loadWagerFromTransaction(transaction)
    }
    catch (err) {
      if (err instanceof GetWagerError) {
        // ignore err
        console.warn(`❌ Get wagers failed.\nfunding account: ${fundingAccount.toBase58()} \ntransaction: ${transaction.transaction.signatures.at(0)}\n`, err)
        return null
      }
      throw err
    }
  }).filter(value => value !== null)

  return loadedWagers
}

export async function syncWagersToDatabase(conn: Connection, {
  id: betId,
  fundingAccount,
}: Pick<Bet, 'fundingAccount' | 'id'>, markFullLoaded = true) {
  const betWagers = await loadWagersByFundingAccount(conn, new PublicKey(fundingAccount!))
  return await db.transaction(async ($db) => {
    await $db
      .delete(wagers)
      .where(eq(
        wagers.betId,
        betId,
      ))

    let count = 0

    if (betWagers.length) {
      count = await $db
        .insert(wagers)
        .values(betWagers)
        .then(s => s.rowCount) ?? 0
    }

    // set wager loaded for bet
    if (markFullLoaded) {
      await $db
        .update(bets)
        .set({
          wagerLoaded: true,
        })
        .where(eq(bets.id, betId))
        .then(s => s.rowCount)
    }

    return count
  })
}
