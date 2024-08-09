import type { PaginationState, Table } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../ui/pagination'
import { cn } from '@/lib/utils'

export function usePaginationState() {
  return useState<PaginationState>({
    pageIndex: 0, // initial page index
    pageSize: 10, // default page size
  })
}

export function TablePagination<T>({
  table,
  onRefetch,
}: {
  table: Table<T>
  onRefetch: () => void
}) {
  const tableState = useMemo(() => table.getState(), [table])

  const pagination = useMemo(() => {
    return tableState.pagination
  }, [tableState])

  const pageCount = useMemo(() => {
    return Math.max(Math.floor(table.getRowCount() / pagination.pageSize), 1)
  }, [pagination.pageSize, table])

  const visibleJumperRange = useMemo(() => {
    const start = Math.max(1, pagination.pageIndex - 2)
    const end = Math.min(pageCount, pagination.pageIndex + 3)
    return [start, end] as const
  }, [pagination.pageIndex, pageCount])

  const canPreviouse = useMemo(() => {
    return table.getCanPreviousPage()
  }, [table])

  const canNext = useMemo(() => {
    return table.getCanNextPage()
  }, [table])

  return (
    <Pagination>
      <PaginationContent>

        <PaginationItem>
          <PaginationPrevious
            aria-disabled={!canPreviouse}
            className={cn(canPreviouse
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-50')}
            onClick={() => {
              if (canPreviouse)
                table.previousPage()
            }}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            onClick={() => {
              onRefetch()
            }}
          >
            <div className="i-mdi-reload" />
          </PaginationLink>
        </PaginationItem>

        {Array.from({
          length: Math.max(1, visibleJumperRange[1] - visibleJumperRange[0]),
        }, (_, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              isActive={(pagination.pageIndex + 1) === visibleJumperRange[0] + index}
              onClick={() => table.setPageIndex(visibleJumperRange[0] + index)}
            >
              {visibleJumperRange[0] + index}
            </PaginationLink>
          </PaginationItem>
        ))}

        {pageCount > (visibleJumperRange[1]) && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            aria-disabled={!canNext}
            className={cn(canNext
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-50')}
            onClick={() => {
              if (canNext)
                table.nextPage()
            }}
          />
        </PaginationItem>

      </PaginationContent>
    </Pagination>
  )
}
