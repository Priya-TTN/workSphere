import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, LayoutGrid, Users, Table2, FileText, Calendar, Sparkles } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import planData from '@/data/plan.json'
import type { PlanItem, Priority } from '@/types'
import { cn } from '@/lib/utils'
import { useGmail } from '@/context/GmailContext'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { formatEventTime } from '@/services/googleCalendar'
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
  const { isConnected: gmailConnected, messages } = useGmail()
  const { isConnected: calendarConnected, todayEvents } = useGoogleCalendar()

  const items = useMemo<PlanItem[]>(() => {
    const baseItems = (planData as PlanItem[]).slice()

    if (!gmailConnected && !calendarConnected) {
      return baseItems
    }

    const dynamicItems: PlanItem[] = []

    // 1. Add connected Google Calendar events
    if (calendarConnected && todayEvents.length > 0) {
      todayEvents.slice(0, 2).forEach((event, idx) => {
        const timeLabel = formatEventTime(event.start.dateTime ?? event.start.date) || '10:00 AM'
        dynamicItems.push({
          id: `cal-plan-${idx}`,
          startTime: timeLabel,
          endTime: 'Next',
          title: event.summary,
          subtitle: `Calendar event ${event.location ? `@ ${event.location}` : ''}`,
          source: 'Calendar',
          priority: 'HIGH',
        })
      })
    }

    // 2. Add extracted Gmail action items
    if (gmailConnected && messages.length > 0) {
      const insights = extractAllMailInsights(messages)
      const actionItems = insights.flatMap((i) =>
        i.actionItems.map((act) => ({ from: i.from, title: act, priority: i.priority }))
      )

      if (actionItems.length > 0) {
        actionItems.slice(0, 2).forEach((act, idx) => {
          dynamicItems.push({
            id: `mail-plan-${idx}`,
            startTime: idx === 0 ? '11:00 AM' : '02:00 PM',
            endTime: idx === 0 ? '11:45 AM' : '02:45 PM',
            title: act.title,
            subtitle: `Extracted from email by ${act.from}`,
            source: 'Email',
            priority: act.priority,
          })
        })
      }
    }

    if (dynamicItems.length > 0) {
      return [...dynamicItems, ...baseItems.slice(dynamicItems.length)]
    }

    return baseItems
  }, [calendarConnected, gmailConnected, messages, todayEvents])

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding} h-full`}>
      <div className={dashboardCardHeader}>
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3 className={dashboardCardTitle}>AI Recommended Plan</h3>
          <AIBadge label="Real-Time Plan" />
        </div>
        <button onClick={() => navigate('/ask-workpilot')} className={dashboardLink}>
          View Full Plan →
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
          <Calendar className="h-7 w-7 text-slate-300 mb-2" />
          <p className="text-xs text-slate-600 font-medium">No plan items available</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Connect Gmail or Google Calendar to generate your AI workday plan.
          </p>
        </div>
      ) : (
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
                        {item.startTime} {item.endTime !== 'Next' ? `– ${item.endTime}` : ''}
                      </span>
                      {item.priority && (
                        <PriorityBadge priority={item.priority as Priority} showLabel={false} />
                      )}
                      {item.source === 'Email' && (
                        <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> Action Item
                        </span>
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
      )}
    </div>
  )
}
