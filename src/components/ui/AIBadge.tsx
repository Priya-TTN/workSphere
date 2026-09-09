import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIBadgeProps {
  className?: string
  label?: string
}

export function AIBadge({ className, label = 'AI Generated' }: AIBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-medium text-purple-600',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  )
}
