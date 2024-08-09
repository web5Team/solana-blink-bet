'use server'

import { getConnection } from '.'

/**
 * use `useLatestBlockHashQuery` instead
 * @returns latest block hash
 */
export async function getLatestBlockhashAction() {
  const conn = getConnection()
  return await conn.getLatestBlockhash()
}
