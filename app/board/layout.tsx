import { redirect } from 'next/navigation'
import { NavHeader, type NavHeaderEntry } from './components/NavHeader'
import { auth } from '@/auth'
import { cn } from '@/lib/utils'

export default async function BoardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const menu: NavHeaderEntry<unknown>[] = [{
    href: '/board/blink-config',
    slug: 'blink-config',
    title: 'Solana Blink 配置',
  }, {
    href: '/board/bet',
    slug: 'bet',
    title: 'Bet 管理',
  }]

  if (!await auth())
    redirect('/signin')

  return (
    <div className={cn('w-screen')}>
      <NavHeader menu={menu} />

      <div className={cn('p-2 md:p-4')}>
        {children}
      </div>
    </div>
  )
}
