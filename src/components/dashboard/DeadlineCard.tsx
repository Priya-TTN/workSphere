import { useNavigate } from 'react-router-dom'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import deadlinesData from '@/data/deadlines.json'
import type { Deadline, Priority } from '@/types'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

export function DeadlineCard() {
  const navigate = useNavigate()
  const deadlines = deadlinesData as Deadline[]

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding}`}>
      <div className={dashboardCardHeader}>
        <h3 className={dashboardCardTitle}>Upcoming Deadlines</h3>
        <button onClick={() => navigate('/tasks')} className={dashboardLink}>
          View All →
        </button>
      </div>

      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <div
            key={deadline.id}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 hover:bg-slate-50 transition-colors"
          >
            <div className="shrink-0 w-[52px]">
              <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                {deadline.date}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-800 leading-snug truncate">
                {deadline.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">From: {deadline.source}</p>
            </div>
            <PriorityBadge priority={deadline.priority as Priority} showLabel={false} />
          </div>
        ))}
      </div>
    </div>
  )
}
