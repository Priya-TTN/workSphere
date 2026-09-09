import { useNavigate } from 'react-router-dom'
import { Mail, Users, LayoutGrid, Calendar, Table2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardCard } from './styles'

interface SourceSummaryCardProps {
  type: 'emails' | 'teams' | 'jira' | 'meetings' | 'excel' | 'documents'
  count: number
  subtitle: string
}

const config = {
  emails: {
    title: 'Emails',
    icon: Mail,
    route: '/emails',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    border: 'hover:border-blue-200/80',
  },
  teams: {
    title: 'Teams',
    icon: Users,
    route: '/teams',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    border: 'hover:border-purple-200/80',
  },
  jira: {
    title: 'Jira',
    icon: LayoutGrid,
    route: '/jira',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'hover:border-blue-200/80',
  },
  meetings: {
    title: 'Meetings',
    icon: Calendar,
    route: '/calendar',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    border: 'hover:border-green-200/80',
  },
  excel: {
    title: 'Excel Files',
    icon: Table2,
    route: '/excel',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    border: 'hover:border-green-200/80',
  },
  documents: {
    title: 'Documents',
    icon: FileText,
    route: '/documents',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    border: 'hover:border-amber-200/80',
  },
}

export function SourceSummaryCard({ type, count, subtitle }: SourceSummaryCardProps) {
  const navigate = useNavigate()
  const cfg = config[type]
  const Icon = cfg.icon

  return (
    <button
      onClick={() => navigate(cfg.route)}
      className={cn(
        dashboardCard,
        'flex flex-col items-start p-4 lg:p-[18px] transition-all hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] text-left h-full min-h-[118px]',
        cfg.border
      )}
    >
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg mb-3', cfg.iconBg)}>
        <Icon className={cn('h-[15px] w-[15px]', cfg.iconColor)} strokeWidth={2} />
      </div>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{cfg.title}</p>
      <p className="text-[22px] font-bold text-slate-900 mt-0.5 leading-none tabular-nums">{count}</p>
      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{subtitle}</p>
    </button>
  )
}
