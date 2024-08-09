import { PublicKey } from '@solana/web3.js'

export const MUSHU_ADDRESS = process.env.NEXT_MUSHU_TOKEN_ADDRESS

export const MUSHU_MINT = new PublicKey(MUSHU_ADDRESS)
