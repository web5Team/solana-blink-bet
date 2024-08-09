import { PublicKey } from '@solana/web3.js'
import ky from 'ky'

export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

export async function getSwapQuote(params: {
  amount: string | number
  inputMint: string
  outputMint: string
  swapMode: 'ExactOut'
}): Promise<any> {
  return await ky.get(`https://quote-api.jup.ag/v6/quote`, {
    searchParams: {
      ...params,
      autoSlippage: true,
      maxAutoSlippageBps: 300,
    },
  }).json()
}

export async function getSwapTransaction(params: {
  quoteResponse: any
  userPublicKey: PublicKey | string
  // feeAccount: PublicKey | string
  trackingAccount: PublicKey | string
  destinationTokenAccount: PublicKey | string
}) {
  const swapBody = {
    wrapAndUnwrapSol: true,
    useSharedAccounts: true,
    prioritizationFeeLamports: 1, // No prioritization fee in this case
    asLegacyTransaction: false,
    // useTokenLedger: false,
    dynamicComputeUnitLimit: true,
    // skipUserAccountsRpcCalls: true,
    ...params,
  }

  return await ky.post(`https://quote-api.jup.ag/v6/swap`, {
    json: swapBody,
  }).json<{
    swapTransaction: string
    lastValidBlockHeight: number
    prioritizationFeeLamports: number
  }>()
}
