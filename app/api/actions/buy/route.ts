import BigNumber from 'bignumber.js'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import type { ActionPostResponse } from '@solana/actions'
import { LAMPORTS_PER_MUSHU, MUSHU_ADDRESS, MUSHU_MINT } from '@/lib/bet/MUSHU'
import { SOL_MINT, getSwapQuote, getSwapTransaction } from '@/lib/solana/swap'
import { getBetRootFundingAccount } from '@/lib/solana'

export async function POST(_req: Request) {
  const body = await _req.json()
  try {
    const { account, params: { value } } = body
    const amount = new BigNumber(value).times(LAMPORTS_PER_MUSHU)
    const userPublicKey = new PublicKey(account)
    const [root] = await getBetRootFundingAccount()

    const quote = await getSwapQuote({
      amount: amount.toString(),
      inputMint: SOL_MINT.toBase58(),
      outputMint: MUSHU_ADDRESS,
      swapMode: 'ExactOut',
    })

    const destinationTokenAccount = await getAssociatedTokenAddress(MUSHU_MINT, userPublicKey, true)

    const {
      swapTransaction,
    } = await getSwapTransaction({
      quoteResponse: quote,
      userPublicKey,
      // feeAccount: MUSHU_ADDRESS,
      trackingAccount: root.publicKey,
      destinationTokenAccount,
    })

    return Response.json({
      transaction: swapTransaction,
      message: '🎉 Swap successful!',
    } as ActionPostResponse)
  }
  catch (err) {
    console.warn('❌ Error in buy route:', err, 'body', body)
    return Response.json({ message: `😓 Internal Server Error: ${err}` }, { status: 400 })
  }
}
