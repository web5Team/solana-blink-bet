import type { PaginationState } from '@tanstack/react-table'
import { wagers } from '@schema'
import db from '@db'
import { count, eq } from 'drizzle-orm'
import { withPagination } from './utils'

export async function getWagers(betId: number, pagination: PaginationState) {
  const items = withPagination(
    db
      .select()
      .from(wagers)
      .where(eq(wagers.betId, betId))
      .$dynamic(),
    pagination.pageIndex + 1,
    pagination.pageSize,
  )

  return {
    items: await items,
    count: await db.select({ count: count() }).from(wagers).then(it => it.at(0)?.count ?? 0),
  }
}
