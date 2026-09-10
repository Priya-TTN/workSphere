import { cn } from '@/lib/utils'

interface AIBadgeProps {
  className?: string
  label?: string
}

export function AIBadge({ className, label = 'AI Generated' }: AIBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
        className
      )}
    >
      <img src="/logo.svg" alt="WorkPilot AI" className="h-3.5 w-3.5 rounded shrink-0 object-contain" />
      {label}
    </span>
  )
}
