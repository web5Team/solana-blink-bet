import type { Wager } from '@schema'
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { renderLinkToSolscanAccount, renderLinkToSolscanTx } from '../lib/utils'
import { getWagersAction, settleForSomeOneAction } from '../lib/actions'
import { Table } from '@/components/ui/table'
import { TablePagination, usePaginationState } from '@/components/common/table/table-pagination'
import { FlatTableHeader } from '@/components/common/table/table-header'
import { FlatTableBody } from '@/components/common/table/table-body'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

const columns: ColumnDef<Wager, any>[] = [
  {
    accessorKey: 'userAddress',
    header: '用户地址',
    cell: renderLinkToSolscanAccount,
  },
  {
    accessorKey: 'signature',
    header: '参加证明',
    cell: renderLinkToSolscanTx,
  },
  {
    accessorKey: 'token',
    header: '使用代币',
  },
  {
    accessorKey: 'amount',
    header: '投入金额',
  },
  {
    accessorKey: 'prediction',
    header: '预测',
  },
  {
    accessorKey: 'profit',
    header: '结算金额',
  },
  {
    accessorKey: 'status',
    header: '结算状态',
  },
  {
    accessorKey: 'profitSignature',
    header: '结算交易证明',
    cell: renderLinkToSolscanTx,
  },
  {
    accessorKey: 'settlementError',
    header: '结算错误信息',
    cell(props) {
      return <pre className="font-mono font-xs min-w-[6rem]">{props.renderValue() || 'N/A'}</pre>
    },
  },
  {
    header: '操作',
    cell({ cell: { row: { original } } }) {
      return <SettleButton {...original} />
    },
  },
]

function SettleButton({ userAddress, status, id }: Wager): any {
  const { mutate, error, isSuccess, reset } = useMutation({
    mutationFn: () => settleForSomeOneAction(id),
  })
  const { toast } = useToast()
  useEffect(() => {
    if (error) {
      toast({
        title: `为 ${userAddress} 结算失败`,
        description: error.message,
        variant: 'destructive',
      })
      reset()
    }
  })
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: `为 ${userAddress.slice(0, 4)}...${userAddress.slice(userAddress.length - 4, userAddress.length)} 结算成功`,
      })
      reset()
    }
  }, [isSuccess, toast, reset, userAddress])
  return (
    <div className="row space-x-2">
      <Button
        disabled={status === 'success'}
        onClick={() => mutate()}
      >
        单独结算
      </Button>
    </div>
  )
}

export function WagerTable({ betId }: { betId: number }) {
  const [pagination, setPagination] = usePaginationState()
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bet', betId, 'wagers', 'table', { pagination }],
    queryFn: () => getWagersAction(betId, pagination),
  })

  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    state: { pagination },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  return (
    <div className="max-w-[62rem]">
      <Table className="min-w-[68rem]">
        <FlatTableHeader table={table} />
        <FlatTableBody
          queryState={{ isFetching, isLoading }}
          table={table}
        />
      </Table>

      <TablePagination
        table={table}
        onRefetch={refetch}
      />
    </div>
  )
}
