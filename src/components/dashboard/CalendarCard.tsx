import { useNavigate } from 'react-router-dom'
import { Users, MapPin } from 'lucide-react'
import calendarData from '@/data/calendar.json'
import type { CalendarEvent } from '@/types'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

export function CalendarCard() {
  const navigate = useNavigate()
  const events = calendarData as CalendarEvent[]

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding}`}>
      <div className={dashboardCardHeader}>
        <h3 className={dashboardCardTitle}>Today&apos;s Calendar</h3>
        <button onClick={() => navigate('/calendar')} className={dashboardLink}>
          View All →
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-[52px] top-2 bottom-2 w-px bg-slate-200" />
        <div className="space-y-0">
          {events.map((event, index) => {
            const isLast = index === events.length - 1
            return (
              <div key={event.id} className={`flex gap-0 ${!isLast ? 'pb-4' : ''}`}>
                <div className="w-[44px] shrink-0 pt-0.5 text-right pr-2">
                  <span className="text-[11px] font-semibold text-slate-600 tabular-nums leading-none">
                    {event.startTime}
                  </span>
                </div>
                <div className="relative flex flex-1 min-w-0 pl-3">
                  <div className="absolute -left-[5px] top-[5px] z-10 h-2 w-2 shrink-0 rounded-full bg-purple-500 ring-2 ring-white" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug">{event.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {event.location.includes('Teams') ? (
                        <Users className="h-3 w-3 text-slate-400 shrink-0" />
                      ) : (
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      )}
                      <span className="text-[11px] text-slate-400 truncate">{event.location}</span>
                    </div>
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
