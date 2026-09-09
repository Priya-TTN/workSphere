import { Mail, Users, LayoutGrid, Calendar, FileText, Table2 } from 'lucide-react'
import { AIBadge } from '@/components/ui/AIBadge'
import type { TaskContextData, ContextSourceType, Task } from '@/types'
import { Button } from '@/components/ui/Button'
import { dashboardCard, dashboardCardPadding, dashboardCardTitle } from '@/components/dashboard/styles'
import { cn } from '@/lib/utils'

const sourceConfig: Record<
  ContextSourceType,
  { icon: typeof Mail; color: string; label: string }
> = {
  Jira: {
    icon: LayoutGrid,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    label: 'Jira',
  },
  Teams: {
    icon: Users,
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    label: 'Teams',
  },
  Email: {
    icon: Mail,
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    label: 'Email',
  },
  Calendar: {
    icon: Calendar,
    color: 'bg-green-50 text-green-600 border-green-100',
    label: 'Calendar',
  },
  Documents: {
    icon: FileText,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    label: 'Documents',
  },
  Excel: {
    icon: Table2,
    color: 'bg-green-50 text-green-700 border-green-100',
    label: 'Excel',
  },
}

const STATUS_OPTIONS: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE']

interface ContextPanelProps {
  context: TaskContextData
  task?: Task
  onStatusChange?: (status: Task['status']) => void
  className?: string
}

export function ContextPanel({ context, task, onStatusChange, className }: ContextPanelProps) {
  return (
    <div className={cn(dashboardCard, dashboardCardPadding, 'h-fit', className)}>
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Cross-Source Context
        </p>
        <h3 className={dashboardCardTitle}>{context.taskId}</h3>
        <p className="text-[13px] text-slate-500 mt-0.5">{context.taskTitle}</p>
      </div>

      {context.items.length > 0 ? (
        <div className="space-y-2.5 mb-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-0.5">
            Confirmed source data
          </p>
          {context.items.map((item) => {
            const cfg = sourceConfig[item.source]
            const Icon = cfg.icon
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                      cfg.color
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Source
                      </span>
                    </div>
                    {item.title && (
                      <p className="text-[13px] font-semibold text-slate-800 leading-snug">
                        {item.title}
                      </p>
                    )}
                    <div className={cn('space-y-0.5', item.title && 'mt-1')}>
                      {item.lines.map((line, lineIndex) => (
                        <p
                          key={`${item.id}-line-${lineIndex}`}
                          className={cn(
                            'leading-relaxed',
                            item.title
                              ? 'text-[12px] text-slate-600'
                              : 'text-[13px] text-slate-700'
                          )}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 mb-4 text-center">
          <p className="text-[13px] text-slate-500">No linked sources found for this task.</p>
        </div>
      )}

      {task && onStatusChange && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Update status
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={task.status === status ? 'default' : 'outline'}
                onClick={() => onStatusChange(status)}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-purple-200/70 bg-gradient-to-br from-purple-50/70 to-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm" aria-hidden="true">✨</span>
          <span className="text-[12px] font-semibold text-purple-700">AI Summary</span>
          <AIBadge label="AI Generated" />
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">{context.aiSummary}</p>
      </div>
    </div>
  )
}
