import { useCallback, useState } from 'react'
import {
  Calendar,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarRange,
  CalendarDays,
  ExternalLink,
  Save,
  Download,
} from 'lucide-react'
import calendarData from '@/data/calendar.json'
import type { CalendarEvent } from '@/types'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { GoogleCalendarConnector } from '@/components/calendar/GoogleCalendarConnector'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import {
  formatEventTime,
  parseDateInput,
  toDateString,
  type GoogleCalendarEvent,
} from '@/services/googleCalendar'

const mockEvents = calendarData as CalendarEvent[]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function downloadIcsRange(events: GoogleCalendarEvent[], start: Date, end: Date) {
  let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WorkPilot AI//EN\n'
  for (const event of events) {
    icsContent += 'BEGIN:VEVENT\n'
    icsContent += `SUMMARY:${event.summary || 'Event'}\n`
    if (event.start.dateTime) {
      icsContent += `DTSTART:${event.start.dateTime.replace(/[-:]/g, '')}\n`
    } else if (event.start.date) {
      icsContent += `DTSTART;VALUE=DATE:${event.start.date.replace(/-/g, '')}\n`
    }
    if (event.end.dateTime) {
      icsContent += `DTEND:${event.end.dateTime.replace(/[-:]/g, '')}\n`
    } else if (event.end.date) {
      icsContent += `DTEND;VALUE=DATE:${event.end.date.replace(/-/g, '')}\n`
    }
    if (event.description) icsContent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`
    if (event.location) icsContent += `LOCATION:${event.location}\n`
    icsContent += 'END:VEVENT\n'
  }
  icsContent += 'END:VCALENDAR\n'

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workpilot-calendar-${toDateString(start)}-to-${toDateString(end)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Event card ───────────────────────────────────────────────────────────────

function GoogleEventCard({ event }: { event: GoogleCalendarEvent }) {
  const startTime = formatEventTime(event.start.dateTime ?? event.start.date)
  const endTime = formatEventTime(event.end.dateTime ?? event.end.date)
  const isAllDay = !event.start.dateTime
  const isOnline =
    event.location?.toLowerCase().includes('meet') ||
    event.location?.toLowerCase().includes('teams') ||
    event.location?.toLowerCase().includes('zoom') ||
    event.location?.toLowerCase().includes('http')

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-purple-50 border border-purple-100">
          <Calendar className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-semibold text-slate-800 leading-snug">{event.summary}</p>
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-slate-400 hover:text-purple-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-0.5">
            {isAllDay ? 'All day' : `${startTime} – ${endTime}`}
          </p>

          {event.location && (
            <div className="flex items-center gap-1.5 mt-2">
              {isOnline ? (
                <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs text-slate-400 truncate">{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">
                {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {event.description && (
            <p className="mt-2 text-xs text-slate-400 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const {
    isConnected,
    events,
    isFetching,
    dateMode,
    setDateMode,
    selectedDate,
    setSelectedDate,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    saveRange,
  } = useGoogleCalendar()

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleSaveRange = () => {
    saveRange(rangeStart, rangeEnd)
    downloadIcsRange(events, rangeStart, rangeEnd)
    setToastMessage(
      `Saved calendar range: ${formatShortDate(rangeStart)} to ${formatShortDate(rangeEnd)} (${events.length} events exported)`
    )
  }

  // Single-day navigation
  const goToPrev = useCallback(() => setSelectedDate(addDays(selectedDate, -1)), [selectedDate, setSelectedDate])
  const goToNext = useCallback(() => setSelectedDate(addDays(selectedDate, 1)), [selectedDate, setSelectedDate])
  const goToToday = useCallback(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setSelectedDate(t)
  }, [setSelectedDate])

  const isToday =
    toDateString(selectedDate) === toDateString((() => { const d = new Date(); d.setHours(0,0,0,0); return d })())

  // ── Header label
  const headerLabel =
    dateMode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatShortDate(rangeStart)} – ${formatShortDate(rangeEnd)}`

  // ── Event count label
  const eventCount = isConnected ? events.length : mockEvents.length
  const eventLabel = `${eventCount} event${eventCount !== 1 ? 's' : ''}`

  return (
    <div className="p-4 lg:p-6 max-w-[800px] mx-auto space-y-5">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
        <p className="text-slate-500 mt-1">
          {headerLabel} · {eventLabel}
        </p>
      </div>

      {/* Connection card */}
      <GoogleCalendarConnector />

      {/* Date controls — only show when connected */}
      {isConnected && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateMode('single')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                dateMode === 'single'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Single day
            </button>
            <button
              onClick={() => setDateMode('range')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                dateMode === 'range'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Date range
            </button>
          </div>

          {/* Single day controls */}
          {dateMode === 'single' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrev} aria-label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <input
                type="date"
                value={toDateString(selectedDate)}
                onChange={(e) => {
                  const d = parseDateInput(e.target.value)
                  if (d) setSelectedDate(d)
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button variant="outline" size="icon" onClick={goToNext} aria-label="Next day">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isToday && (
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              )}
            </div>
          )}

          {/* Range controls */}
          {dateMode === 'range' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
                  <label className="text-xs text-slate-500 font-medium">From</label>
                  <input
                    type="date"
                    value={toDateString(rangeStart)}
                    onChange={(e) => {
                      const d = parseDateInput(e.target.value)
                      if (d) {
                        setRangeStart(d)
                        if (d > rangeEnd) setRangeEnd(d)
                      }
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
                  <label className="text-xs text-slate-500 font-medium">To</label>
                  <input
                    type="date"
                    value={toDateString(rangeEnd)}
                    min={toDateString(rangeStart)}
                    onChange={(e) => {
                      const d = parseDateInput(e.target.value)
                      if (d) setRangeEnd(d)
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {events.length} event{events.length !== 1 ? 's' : ''} in selected range
                </span>
                <Button size="sm" onClick={handleSaveRange} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  <Download className="h-3.5 w-3.5" />
                  Save Range & Export
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast
        message={toastMessage || ''}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />

      {/* Events list */}
      {isConnected ? (
        isFetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-slate-500">Fetching events…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No events found</p>
            <p className="text-xs text-slate-400 mt-1">
              {dateMode === 'single'
                ? 'Nothing scheduled for this day'
                : 'No events in this date range'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <GoogleEventCard key={event.id} event={event} />
            ))}
          </div>
        )
      ) : (
        /* Not connected — clean empty state */
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <CalendarDays className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-slate-700">No Calendar Connected</p>
          <p className="text-xs text-slate-500 mt-1">
            Connect your Google Calendar with a Secret iCal URL above to sync your meetings and schedule.
          </p>
        </div>
      )}
    </div>
  )
}
