import { cn } from '@/lib/utils'

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn(
      'i-line-md-loading-twotone-loop',
      className,
    )}
    />
  )
}
