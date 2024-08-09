// @vitest-environment node

import { describe, expect, it } from 'vitest'
// import { getBetDerivedAccount, getBetRootFundingAccount } from '.'

describe('solana', () => {
  // const mnemonic = 'memory test'
  // it('get root funding account', async () => {
  //   const [kp] = await getBetRootFundingAccount(mnemonic)
  //   expect(kp.publicKey.toBase58()).eq('8GnvhM7GHsLhXerUCStKjEyhfgKXRJreuG8CUyCuK2yS')
  // })

  // it('bet root generate root wallet', async () => {
  //   const keypair = await getBetDerivedAccount(1, mnemonic)
  //   expect(keypair.publicKey.toBase58()).eq('8TuMJa8FEK1MTsuc71S4AM6PDnXFgDtAuqZ3b46jNA32')
  // })

  it('ok', async () => {
    expect(1 + 1).eq(2)
  })
})
