import { cn } from '@/lib/utils'
import type { Priority } from '@/types'

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  HIGH: {
    label: 'High',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  LOW: {
    label: 'Low',
    className: 'bg-green-50 text-green-600 border-green-200',
  },
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
  showLabel?: boolean
}

export function PriorityBadge({ priority, className, showLabel = true }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {showLabel ? `${config.label} Priority` : config.label}
    </span>
  )
}
