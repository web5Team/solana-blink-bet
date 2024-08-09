import type { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js'
import { chunk, sleep } from '@utils'
import { getConnection } from '../../lib/solana'

/**
 * 获取某个地址下的所有事务
 * @returns 事务列表
 */
export async function fetchTransactions({
  address,
  limit,
  limitReq,
  before,
  includeErr,
}: {
  address: PublicKey
  limit: number
  limitReq?: number
  before?: string
  includeErr?: boolean
}) {
  const conn = getConnection()
  const signatures: Array<ConfirmedSignatureInfo> = []

  async function loadSignatures(before?: string) {
    const scopedLimit = Math.min(limitReq ?? 1000)
    const items = await conn.getSignaturesForAddress(address, {
      before,
      limit: scopedLimit,
    }).then((items) => {
      return items.filter((item) => {
        // ignore err transaction by default
        if (includeErr)
          return true
        return item.err === null
      })
    })
    signatures.push(...items)
    if (signatures.length >= limit) {
      signatures.length = limit
      return
    }
    if (items.length >= scopedLimit) {
      await sleep(500)
      await loadSignatures(items.at(-1)?.signature)
    }
  }

  await loadSignatures(before)

  const chunks = chunk(signatures, 1000)

  const tasks = chunks.map(async (chunk) => {
    const transactions = await conn.getParsedTransactions(
      chunk.map(sig => sig.signature),
    )
    return transactions
      .filter(value => value !== null)
  })

  const result = await Promise.all(tasks)

  return result.flat()
}
