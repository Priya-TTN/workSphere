import calendarData from '@/data/calendar.json'
import type { CalendarEvent } from '@/types'
import { Calendar, Users, MapPin } from 'lucide-react'

export function CalendarPage() {
  const events = calendarData as CalendarEvent[]

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
        <p className="text-slate-500 mt-1">Tuesday, 10 June 2025 · {events.length} events today</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-purple-50 border border-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-800">{event.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {event.startTime} – {event.endTime}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {event.location.includes('Teams') ? (
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className="text-xs text-slate-400">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
