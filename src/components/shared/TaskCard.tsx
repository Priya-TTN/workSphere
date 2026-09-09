import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { formatShortDate } from '@/lib/utils'
import type { Task } from '@/types'
import { Mail, Users, LayoutGrid, Calendar, Table2, FileText } from 'lucide-react'

const sourceIcons: Record<string, typeof Mail> = {
  Jira: LayoutGrid,
  Teams: Users,
  Email: Mail,
  Calendar: Calendar,
  Excel: Table2,
  Documents: FileText,
  Internal: FileText,
}

const statusColors: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-600',
  DONE: 'bg-green-50 text-green-600',
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  selected?: boolean
}

export function TaskCard({ task, onClick, selected }: TaskCardProps) {
  const Icon = sourceIcons[task.source] || FileText

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
        selected ? 'border-purple-300 bg-purple-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
            <Icon className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{task.id !== task.title ? task.id : ''}</p>
            <p className="text-sm text-slate-700">{task.title}</p>
          </div>
        </div>
        <PriorityBadge priority={task.priority} showLabel={false} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
        <span className="text-xs text-slate-400">Due: {formatShortDate(task.deadline)}</span>
        <span className="text-xs text-slate-400">{task.estimatedMinutes}min</span>
        <span className="text-xs text-slate-400">{task.source}</span>
      </div>
    </button>
  )
}
