import { type FC, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { createBetAction } from '../lib/actions'
import { createBetActionSchema } from '../lib/actions/schema'
import { dayjs } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export const BetCreateDialog: FC<{ children: React.ReactNode, onCreated?: () => void }> = ({
  children,
  onCreated,
}) => {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const form = useForm<z.infer<typeof createBetActionSchema>>({
    resolver: zodResolver(createBetActionSchema),
    defaultValues: {
      startedAt: dayjs().add(2, 'minutes').format('YYYY-MM-DDTHH:mm'),
      scheduledDrawingAt: dayjs().add(1, 'hours').format('YYYY-MM-DDTHH:mm'),
    },
  })

  const { mutate, error, isPending, isSuccess, reset } = useMutation({
    mutationFn: createBetAction,
  })

  useEffect(() => {
    if (isSuccess) {
      reset()
      toast({
        title: 'Bet created',
      })
      onCreated?.()
      setOpen(false)
    }
  }, [isSuccess, onCreated, toast, reset])

  useEffect(() => {
    if (error) {
      reset()
      toast({
        title: 'Failed to create bet',
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [error, toast, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            New Bet
          </DialogTitle>
          <DialogDescription>
            Create a new bet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(values => mutate(values))}
          >
            <FormField
              control={form.control}
              name="startedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Start Time (UTC+
                    {dayjs().utcOffset() / 60}
                    )
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="w-auto"
                      placeholder="Input bet start time"
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDrawingAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Scheduled Drawing At
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="w-auto"
                      placeholder="Input scheduled drawing time"
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={isPending}
              type="submit"
            >
              {isPending && <div className="i-line-md-loading-twotone-loop mr-2" />}
              Create
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
