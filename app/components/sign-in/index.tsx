'use client'
import { type SubmitHandler, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthError } from 'next-auth'
import { parseUnknownError } from '@utils'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { signInAction } from './actions'
import { signInSchema } from '@/auth'

export function SignIn() {
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit: SubmitHandler<{
    username: string
    password: string
  }> = async (values) => {
    try {
      await signInAction(
        'credentials',
        {
          redirect: false,
          ...values,
        },
      )
      router.replace('/board')
    }
    catch (err: any) {
      if (err instanceof AuthError) {
        toast({
          title: 'Auth failed.',
          description: err.message,
        })
      }
      else {
        toast({
          title: 'Internal Error',
          description: parseUnknownError(err),
        })
      }
    }
  }
  return (
    <Card className="min-w-[24rem]">
      <CardHeader>
        <CardTitle>
          Sign In
        </CardTitle>
        <CardDescription>
          Manage backend data
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <Button
              className="w-full"
              type="submit"
            >
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
