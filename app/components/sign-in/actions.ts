'use server'
import { signIn } from '@/auth'

export const signInAction: typeof signIn = async (provider, options, params) => {
  return await signIn(provider, options, params)
}
