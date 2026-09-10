import { useNavigate } from 'react-router-dom'
import { Users, MapPin, Loader2, CalendarDays } from 'lucide-react'
import calendarData from '@/data/calendar.json'
import type { CalendarEvent } from '@/types'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import { formatEventTime, type GoogleCalendarEvent } from '@/services/googleCalendar'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

const mockEvents = calendarData as CalendarEvent[]

function TimelineDot() {
  return (
    <div className="absolute -left-[5px] top-[5px] z-10 h-2 w-2 shrink-0 rounded-full bg-purple-500 ring-2 ring-white" />
  )
}

export function CalendarCard() {
  const navigate = useNavigate()
  const { isConnected, todayEvents, isFetching } = useGoogleCalendar()

  // ── Google Calendar events for today ──────────────────────────────────────

  if (isConnected) {
    return (
      <div className={`${dashboardCard} ${dashboardCardPadding}`}>
        <div className={dashboardCardHeader}>
          <h3 className={dashboardCardTitle}>Today&apos;s Calendar</h3>
          <button onClick={() => navigate('/calendar')} className={dashboardLink}>
            View All →
          </button>
        </div>

        {isFetching ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-xs text-slate-400">Loading events…</span>
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarDays className="h-7 w-7 text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">No events today</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[52px] top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-0">
              {todayEvents.map((event: GoogleCalendarEvent, index) => {
                const startTime = formatEventTime(event.start.dateTime ?? event.start.date)
                const isLast = index === todayEvents.length - 1
                const isOnline =
                  event.location?.toLowerCase().includes('meet') ||
                  event.location?.toLowerCase().includes('teams') ||
                  event.location?.toLowerCase().includes('zoom')

                return (
                  <div key={event.id} className={`flex gap-0 ${!isLast ? 'pb-4' : ''}`}>
                    <div className="w-[44px] shrink-0 pt-0.5 text-right pr-2">
                      <span className="text-[11px] font-semibold text-slate-600 tabular-nums leading-none">
                        {startTime === 'All day' ? 'All' : startTime}
                      </span>
                    </div>
                    <div className="relative flex flex-1 min-w-0 pl-3">
                      <TimelineDot />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 leading-snug">
                          {event.summary}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1">
                            {isOnline ? (
                              <Users className="h-3 w-3 text-slate-400 shrink-0" />
                            ) : (
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            )}
                            <span className="text-[11px] text-slate-400 truncate">
                              {event.location}
                            </span>
                          </div>
                        )}
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

  // ── Fallback: mock data ────────────────────────────────────────────────────

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
          {mockEvents.map((event, index) => {
            const isLast = index === mockEvents.length - 1
            return (
              <div key={event.id} className={`flex gap-0 ${!isLast ? 'pb-4' : ''}`}>
                <div className="w-[44px] shrink-0 pt-0.5 text-right pr-2">
                  <span className="text-[11px] font-semibold text-slate-600 tabular-nums leading-none">
                    {event.startTime}
                  </span>
                </div>
                <div className="relative flex flex-1 min-w-0 pl-3">
                  <TimelineDot />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug">
                      {event.title}
                    </p>
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

      {/* Subtle connect nudge */}
      <button
        onClick={() => navigate('/calendar')}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-200 py-2 text-xs text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors"
      >
        Connect Google Calendar for real events →
      </button>
    </div>
  )
}
