import NextAuth, { type User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { redirect } from 'next/navigation'
import { object, string } from 'zod'

export const signInSchema = object({
  username: string({ required_error: 'username is required' })
    .min(1, 'username is required'),
  password: string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .min(8, 'Password must be more than 8 characters')
    .max(32, 'Password must be less than 32 characters'),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials, _request) {
        try {
          let user: User | null = null
          // const pwHash = await bcrypt.hash(String(credentials.password), process.env.AUTH_SECRET!)
          // user =
          const { password, username } = await signInSchema.parseAsync(credentials)
          if (password === 'qwerqwerqwer' && username === 'admin') {
            user = {
              id: '1',
              name: 'admin',
            }
          }
          if (!user)
            throw new Error('Login failed.')
          return user
        }
        catch {
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/signin',
  },
})

export async function assertAuth(shouldRedirect = true) {
  const sess = await auth()
  if ((!sess || !sess?.user) && shouldRedirect)
    redirect('/signin')
  return sess!.user
}
