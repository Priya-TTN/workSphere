import { useNavigate } from 'react-router-dom'
import { Mail, LayoutGrid, Users, Table2, FileText, Calendar } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import planData from '@/data/plan.json'
import type { PlanItem, Priority } from '@/types'
import { cn } from '@/lib/utils'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

const sourceIcons: Record<string, typeof Mail> = {
  Jira: LayoutGrid,
  Email: Mail,
  Meeting: Users,
  Excel: Table2,
  Internal: FileText,
  Calendar: Calendar,
}

const dotColors: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-green-500',
  default: 'bg-purple-500',
}

export function AIRecommendedPlan() {
  const navigate = useNavigate()
  const items = planData as PlanItem[]

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding} h-full`}>
      <div className={dashboardCardHeader}>
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3 className={dashboardCardTitle}>AI Recommended Plan</h3>
          <AIBadge label="AI Recommendation" />
        </div>
        <button onClick={() => navigate('/ask-workpilot')} className={dashboardLink}>
          View Full Plan →
        </button>
      </div>

      <div className="relative pl-5">
        <div className="absolute left-[9px] top-2 bottom-3 w-px bg-slate-200" />
        <div className="space-y-0">
          {items.map((item, index) => {
            const Icon = sourceIcons[item.source] || Calendar
            const dotColor = item.priority ? dotColors[item.priority] : dotColors.default
            const isLast = index === items.length - 1
            return (
              <div key={item.id} className={cn('relative', !isLast && 'pb-4')}>
                <div
                  className={`absolute -left-5 top-[7px] z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white ${dotColor} shadow-sm`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                      {item.startTime} – {item.endTime}
                    </span>
                    {item.priority && (
                      <PriorityBadge priority={item.priority as Priority} showLabel={false} />
                    )}
                  </div>
                  <p className="text-[13px] font-semibold text-slate-800 mt-0.5 leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Icon className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 truncate">{item.subtitle}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
