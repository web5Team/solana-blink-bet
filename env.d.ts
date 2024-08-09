declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SOLANA_ENDPOINT: string
      NEXT_RECIPIENT_MNEMONIC: string
      NEXT_MUSHU_TOKEN_ADDRESS: string
      NEXT_DATABASE_URL: string
      NEXT_MEMO_SECRET: string
      NEXT_INTERNAL_API_SECRET: string
      NEXT_BOARD_PASSWORD: string
      AUTH_SECRET: string
      NODE_ENV: string
      PORT?: string
    }
  }
}

export {}
