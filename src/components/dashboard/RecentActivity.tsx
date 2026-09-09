import { useNavigate } from 'react-router-dom'
import { Mail, Users, LayoutGrid, FileText, CheckSquare } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime } from '@/lib/utils'
import type { Activity } from '@/types'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

const iconMap: Record<Activity['type'], typeof Mail> = {
  email: Mail,
  teams: Users,
  jira: LayoutGrid,
  document: FileText,
  task: CheckSquare,
}

const colorMap: Record<Activity['type'], string> = {
  email: 'bg-blue-50 text-blue-500',
  teams: 'bg-purple-50 text-purple-500',
  jira: 'bg-blue-50 text-blue-600',
  document: 'bg-amber-50 text-amber-500',
  task: 'bg-green-50 text-green-500',
}

export function RecentActivity() {
  const navigate = useNavigate()
  const { activities } = useApp()

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding}`}>
      <div className={dashboardCardHeader}>
        <h3 className={dashboardCardTitle}>Recent Activity</h3>
        <button onClick={() => navigate('/reports')} className={dashboardLink}>
          View All →
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.slice(0, 4).map((activity) => {
          const Icon = iconMap[activity.type]
          return (
            <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorMap[activity.type]}`}
              >
                <Icon className="h-[14px] w-[14px]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-800 leading-snug">{activity.title}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{activity.description}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 pt-0.5 tabular-nums">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
