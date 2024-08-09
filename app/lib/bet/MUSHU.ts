import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export const MUSHU_ADDRESS = process.env.NEXT_MUSHU_TOKEN_ADDRESS
export const LAMPORTS_PER_MUSHU = BigNumber(10).pow(10)

export const MUSHU_MINT = new PublicKey(MUSHU_ADDRESS)
