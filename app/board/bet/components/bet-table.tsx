'use client'

import type { Bet } from '@db'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { deleteBetAction, getBetsAction, settleAllBetsAction } from '../lib/actions'
import { renderDateWithRelative, renderLinkToSolscanAccount, renderLinkToSolscanTx } from '../lib/utils'
import { BetCreateDialog } from './bet-create'
import { WagerTable } from './wager-table'
import { FlatTableBody } from '@/components/common/table/table-body'
import { FlatTableHeader } from '@/components/common/table/table-header'
import { TablePagination, usePaginationState } from '@/components/common/table/table-pagination'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { ActionsCol } from '@/components/common/table/table-columns'
import { useToast } from '@/components/ui/use-toast'
import { Loading } from '@/components/common/loading'
import { useLatestBlockHashQuery } from '@/lib/solana/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const columns: ColumnDef<Bet, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'startedAt',
    header: '设定开始时间',
    cell: renderDateWithRelative,
  },
  {
    accessorKey: 'scheduledDrawingAt',
    header: '设定结束时间',
    cell: renderDateWithRelative,
  },
  {
    accessorKey: 'closedAt',
    header: '实际结束时间',
    cell: renderDateWithRelative,
  },
  {
    accessorKey: 'result',
    header: '结果',
    accessorFn: bet => bet.result?.toUpperCase() ?? 'N/A',
  },
  {
    accessorKey: 'status',
    header: '状态',
  },
  {
    accessorKey: 'settlementSignature',
    header: '结算签名Hash',
    // accessorFn: bet => bet.settlementSignature ?? 'N/A',
    cell: renderLinkToSolscanTx,
  },
  {
    accessorKey: 'settlementError',
    header: '结算错误信息',
    // accessorFn: bet => bet.settlementError ?? 'N/A',
    cell(props) {
      return <pre className="font-mono font-xs min-w-[6rem]">{props.renderValue() || 'N/A'}</pre>
    },
  },
  {
    accessorKey: 'fundingAccount',
    header: '资金账户',
    cell: renderLinkToSolscanAccount,
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: renderDateWithRelative,
  },
  {
    id: 'actions',
    header: '操作',
    cell: (cell) => {
      return (
        <ActionsCol
          cell={cell}
          dataQueryKey={{ queryKey: ['bet', 'table'] }}
          onDelete={deleteBetAction}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">玩家列表</Button>
            </DialogTrigger>
            <DialogContent className="!max-w-none w-auto">
              <DialogHeader>
                <DialogTitle>玩家列表</DialogTitle>
                <DialogDescription>
                  赌局 [
                  {cell.row.original.id}
                  ] 中的玩家
                </DialogDescription>
              </DialogHeader>
              <WagerTable betId={cell.row.original.id} />
            </DialogContent>
          </Dialog>
        </ActionsCol>
      )
    },
  },
]

export function BetTable() {
  const [latestBlockHeight, setLatestBlockHeight] = useState(0)
  const [pagination, setPagination] = usePaginationState()
  const { toast } = useToast()

  const {
    mutateAsync: settleAllBets,
    reset: resetSettleBetsMutation,
    data: settleResult,
    isSuccess: settleBetsSuccess,
    isPending: settleBetsPending,
    error: settleBetsError,
  } = useMutation({
    mutationFn: settleAllBetsAction,
  })

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bet', 'table', pagination],
    queryFn: () => getBetsAction(pagination.pageIndex + 1, pagination.pageSize),
    placeholderData: keepPreviousData,
  })

  const { data: latestBlockhash } = useLatestBlockHashQuery()

  useEffect(() => {
    if (latestBlockhash)
      setLatestBlockHeight(latestBlockhash.lastValidBlockHeight)
  }, [latestBlockhash])

  const table = useReactTable({
    columns,
    state: { pagination },
    data: data?.items ?? [],
    rowCount: data?.count ?? 0,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  useEffect(() => {
    if (settleBetsError) {
      toast({
        title: '结算出现异常',
        description: settleBetsError.message,
        variant: 'destructive',
      })
    }
  }, [settleBetsError, toast])

  useEffect(() => {
    if (settleBetsSuccess) {
      resetSettleBetsMutation()
      toast({
        title: '所有赌局结算成功',
        description: `结算赌局数量: ${settleResult}`,
      })
      refetch()
    }
  }, [refetch, resetSettleBetsMutation, settleBetsSuccess, settleResult, toast])

  return (
    <div className="space-y-4">
      <div className="row space-x-2 items-center">
        <BetCreateDialog onCreated={refetch}>
          <Button disabled={settleBetsPending}>创建</Button>
        </BetCreateDialog>

        <Button
          disabled={settleBetsPending}
          onClick={() => settleAllBets()}
        >
          {settleBetsPending && <Loading className="mr-2" />}
          结算
        </Button>

        <div className="flex-grow" />

        <div className="text-xs text-gray-400">
          Latest Block Height:
          {' '}
          {latestBlockHeight || 'N/A'}
        </div>
      </div>

      <div className="rounded-md border">
        <Table className="min-w-[70rem] min-h-32">
          <FlatTableHeader
            table={table}
          />

          <FlatTableBody
            queryState={{ isLoading, isFetching }}
            table={table}
          />
        </Table>
      </div>

      <TablePagination
        table={table}
        onRefetch={refetch}
      />
    </div>
  )
}
