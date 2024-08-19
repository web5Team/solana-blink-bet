/* eslint-disable unused-imports/no-unused-vars */
import { type InvalidateQueryFilters, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CellContext } from '@tanstack/react-table'
import React, { type ComponentProps, useEffect, useState } from 'react'
import { Button } from '../../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/use-toast'

export function ActionsCol<T extends { id: unknown }>({
  cell: {
    row,
  },
  dataQueryKey,
  onDelete,
  children,
}: {
  children?: React.ReactNode
  cell: CellContext<T, unknown>
  dataQueryKey?: InvalidateQueryFilters
  onDelete?: (id: T['id']) => Promise<unknown>
}) {
  const queryClient = useQueryClient()
  return (
    <div className="space-x-2 row">
      {children}
      {/* {onDelete && (
        <PopoverConfirmToAction
          label="Delete"
          variant="destructive"
          action={async () => {
            await onDelete?.(row.original.id)
            await queryClient.invalidateQueries({
              refetchType: 'all',
              exact: false,
              ...dataQueryKey,
            })
          }}
        >
          <Button variant="destructive">
            Delete
          </Button>
        </PopoverConfirmToAction>
      )} */}
    </div>
  )
}

function PopoverConfirmToAction({
  label,
  action,
  children,
  variant = 'default',
}: {
  label: string
  action: () => Promise<unknown>
  variant: ComponentProps<typeof Badge>['variant']
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { reset, mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: action,
  })
  useEffect(() => {
    if (error) {
      reset()
      toast({
        title: 'Failed to perform action',
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [error, toast, reset])
  useEffect(() => {
    if (isSuccess) {
      reset()
      toast({
        title: 'Action performed',
      })
      setOpen(false)
    }
  }, [isSuccess, reset, toast])
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <h4 className="text-lg font-bold">
            You sure you want to
            <Badge
              className="align-text-top mx-1"
              variant={variant}
            >
              {label}
            </Badge>
            ?
          </h4>

          <div className="row justify-end space-x-2">
            <Button
              disabled={isPending}
              variant={variant}
              onClick={() => mutate()}
            >
              {isPending && <div className="i-line-md-loading-twotone-loop mr-2" />}
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
