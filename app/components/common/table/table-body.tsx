import { type Table, flexRender } from '@tanstack/react-table'
import type { UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TableBody, TableCell, TableRow } from '../../ui/table'

export function FlatTableBody({
  table,
  queryState: {
    isLoading,
    isFetching,
  },
}: {
  table: Table<any>
  queryState: Pick<UseQueryResult, 'isLoading' | 'isFetching'>
}) {
  const columnLength = useMemo(() => table.getVisibleFlatColumns().length, [table])

  const Empty = useMemo(() => (
    <TableRow>
      <TableCell
        className="h-24 text-center"
        colSpan={columnLength}
      >
        No results.
      </TableCell>
    </TableRow>
  ), [columnLength])

  const Loading = useMemo(() => {
    return (
      <TableRow className="absolute inset-0 z-10">
        <TableCell
          className="h-24 text-center"
          colSpan={columnLength}
        >
          <div className="absolute inset-0 bg-black/20 col justify-center items-center">
            <div className="i-line-md-loading-twotone-loop text-xl" />
          </div>
        </TableCell>
      </TableRow>
    )
  }, [columnLength])

  return (
    <TableBody>
      {(isFetching || isLoading) && Loading}
      {table.getRowModel().rows.length
        ? (table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          )))
        : !isFetching && Empty}
    </TableBody>
  )
}
