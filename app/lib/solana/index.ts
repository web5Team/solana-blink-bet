import process from 'node:process'
import { type Commitment, ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { mnemonicToSeed } from 'bip39'
import { HDKey } from 'micro-ed25519-hdkey'

export * from './transactions'

export function getConnection(commitment: Commitment = 'confirmed') {
  const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_ENDPOINT, commitment)
  return conn
}

const betRootFundingAccountCache = new Map<string, [Keypair, HDKey]>()

// 获取Bet资金账户
export async function getBetRootFundingAccount(mnemonic = process.env.NEXT_RECIPIENT_MNEMONIC) {
  if (betRootFundingAccountCache.get(mnemonic))
    return betRootFundingAccountCache.get(mnemonic)!
  const seed = await mnemonicToSeed(mnemonic, '')
  const hd = HDKey.fromMasterSeed(seed.toString('hex'))
  const keypair = Keypair.fromSeed(hd.derive(`m/44'/501'/0'/0'`).privateKey)
  betRootFundingAccountCache.set(mnemonic, [keypair, hd] as const)
  return betRootFundingAccountCache.get(mnemonic)!
}

export async function getBetDerivedAccount(index: number, mnemonic = process.env.NEXT_RECIPIENT_MNEMONIC) {
  const [, hd] = await getBetRootFundingAccount(mnemonic)
  const path = `m/44'/501'/${index}'/0'`
  return Keypair.fromSeed(hd.derive(path).privateKey)
}

export async function getOptimalPriorityFee(connection: Connection) {
  const priorityFees = await connection.getRecentPrioritizationFees()
  if (priorityFees.length) {
    const maxFee = Math.max(...priorityFees.map(fee => fee.prioritizationFee))
    // 将最高费用提高 20%，确保我们的交易有较高优先级
    return Math.ceil(maxFee * 1.2)
  }
  return 1000 // 默认值，如果无法获取当前费用
}

export async function getPriorityFeeInstruction(connection: Connection) {
  const optimalFee = await getOptimalPriorityFee(connection)
  console.info('📔 Optimal fee for now:', optimalFee)
  const setComputeUnitPriceIns = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: optimalFee,
  })
  const setComputedUnitLimitIns = ComputeBudgetProgram.setComputeUnitLimit({
    units: 0.01 * LAMPORTS_PER_SOL,
  })
  return [
    setComputeUnitPriceIns,
    setComputedUnitLimitIns,
  ]
}
