'use client'
import Link, { type LinkProps } from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

export interface NavHeaderEntry<T> extends LinkProps<T> {
  title: string
  slug: string
}

export function NavHeader({ menu }: { menu: NavHeaderEntry<unknown>[] }) {
  const segment = useSelectedLayoutSegment()
  return (
    <div className={cn('w-full z-50 border-b-border/60 border-b-[0.0625rem] p-2 sticky top-0 inset-x-0 bg-background/60 backdrop-blur-md')}>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className={cn('cursor-pointer py-2 px-4 font-bold font-mono border-2 border-primary/10 text-primary shadow-sm shadow-primary/10 mr-2 rounded')}>
            <Link href="/board">
              Control Panel
            </Link>
          </NavigationMenuItem>

          {menu.map((item, index) => (
            <NavigationMenuItem key={`${item.title}-${index}`}>
              <NavigationMenuLink
                asChild
                active={item.slug === segment}
                className={cn(navigationMenuTriggerStyle(), 'cursor-pointer text-foreground/60 data-[active]:text-foreground')}
              >
                <Link {...item}>
                  {item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
