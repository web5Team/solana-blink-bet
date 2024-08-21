// @vitest-environment node
import bs58 from 'bs58'
import { describe, expect, it } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { LAMPORTS_PER_MUSHU, MUSHU_ADDRESS, MUSHU_MINT } from '../bet/MUSHU'
import { getSwapQuote, getSwapTransaction } from './swap'

describe('mUSHU Token', () => {
  it('swap', { timeout: 10000 }, async () => {
    const mushuRequiredAmount = 3416448
    const bob = new PublicKey(bs58.decode('4nKiPKGKbQa2NNDspNU2E15pGfKVbBeJJqe3v83msT5o'))

    const bobMUSHUTokenAccount = await getAssociatedTokenAddress(MUSHU_MINT, bob, true)

    const query = {
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: MUSHU_ADDRESS,
      amount: LAMPORTS_PER_MUSHU.times(mushuRequiredAmount).toString(),
      swapMode: 'ExactOut',
    } as const

    const quoteResponse = await getSwapQuote({
      amount: query.amount,
      inputMint: query.inputMint,
      outputMint: query.outputMint,
      swapMode: query.swapMode,
    })

    const response = await getSwapTransaction({
      quoteResponse,
      userPublicKey: bob,
      // feeAccount: bob,
      trackingAccount: bob,
      destinationTokenAccount: bobMUSHUTokenAccount,
    })

    console.info(response)
    expect(response)
      .toHaveProperty('swapTransaction')
  })
})
