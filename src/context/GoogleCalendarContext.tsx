import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  clearIcalUrl,
  eventsInRange,
  fetchIcsFeed,
  getStoredIcalUrl,
  isGoogleCalendarConnected,
  saveIcalUrl,
  today,
  type GoogleCalendarEvent,
} from '@/services/googleCalendar'

export type DateMode = 'single' | 'range'

interface GoogleCalendarContextType {
  isConnected: boolean
  isLoading: boolean
  events: GoogleCalendarEvent[]
  todayEvents: GoogleCalendarEvent[]
  upcomingEvents: GoogleCalendarEvent[]
  allFeedEvents: GoogleCalendarEvent[]
  isFetching: boolean
  connectError: string | null
  dateMode: DateMode
  setDateMode: (mode: DateMode) => void
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  rangeStart: Date
  setRangeStart: (date: Date) => void
  rangeEnd: Date
  setRangeEnd: (date: Date) => void
  saveRange: (start: Date, end: Date) => void
  connect: (icalUrl: string) => Promise<boolean>
  disconnect: () => void
  refetch: () => Promise<void>
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | null>(null)

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(isGoogleCalendarConnected)
  const [isLoading, setIsLoading] = useState(false)
  const [icsText, setIcsText] = useState<string | null>(() => {
    return localStorage.getItem('workpilot_cached_ics')
  })
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [todayEvents, setTodayEvents] = useState<GoogleCalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([])
  const [allFeedEvents, setAllFeedEvents] = useState<GoogleCalendarEvent[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [dateMode, setDateMode] = useState<DateMode>(() => {
    return (localStorage.getItem('workpilot_gcal_mode') as DateMode) || 'single'
  })
  const [selectedDate, setSelectedDate] = useState<Date>(today())
  const [rangeStart, setRangeStart] = useState<Date>(() => {
    const s = localStorage.getItem('workpilot_gcal_range_start')
    return s ? new Date(s) : today()
  })
  const [rangeEnd, setRangeEnd] = useState<Date>(() => {
    const e = localStorage.getItem('workpilot_gcal_range_end')
    return e ? new Date(e) : today()
  })

  const loadFeed = useCallback(async (icalUrl: string) => {
    setIsFetching(true)
    setConnectError(null)
    try {
      const text = await fetchIcsFeed(icalUrl)
      setIcsText(text)
      localStorage.setItem('workpilot_cached_ics', text)
      setIsConnected(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load Google Calendar.'
      setConnectError(message)
      return false
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = getStoredIcalUrl()
    if (stored) {
      void loadFeed(stored)
    } else {
      setIsLoading(false)
    }
  }, [loadFeed])

  useEffect(() => {
    if (!icsText) {
      setEvents([])
      setTodayEvents([])
      setUpcomingEvents([])
      setAllFeedEvents([])
      return
    }

    const start = dateMode === 'single' ? selectedDate : rangeStart
    const end = dateMode === 'single' ? selectedDate : rangeEnd
    setEvents(eventsInRange(icsText, start, end))
    setTodayEvents(eventsInRange(icsText, today(), today()))

    const nextMonth = new Date(today())
    nextMonth.setDate(nextMonth.getDate() + 60)
    setUpcomingEvents(eventsInRange(icsText, today(), nextMonth))

    const pastWindow = new Date(today())
    pastWindow.setDate(pastWindow.getDate() - 30)
    const futureWindow = new Date(today())
    futureWindow.setDate(futureWindow.getDate() + 365)
    setAllFeedEvents(eventsInRange(icsText, pastWindow, futureWindow))
  }, [icsText, dateMode, selectedDate, rangeStart, rangeEnd])

  const saveRange = useCallback((start: Date, end: Date) => {
    setRangeStart(start)
    setRangeEnd(end)
    setDateMode('range')
    localStorage.setItem('workpilot_gcal_mode', 'range')
    localStorage.setItem('workpilot_gcal_range_start', start.toISOString())
    localStorage.setItem('workpilot_gcal_range_end', end.toISOString())
  }, [])

  const connect = useCallback(
    async (icalUrl: string) => {
      const ok = await loadFeed(icalUrl)
      if (ok) saveIcalUrl(icalUrl)
      return ok
    },
    [loadFeed]
  )

  const disconnect = useCallback(() => {
    clearIcalUrl()
    setIsConnected(false)
    setIcsText(null)
    setEvents([])
    setTodayEvents([])
    setUpcomingEvents([])
    setAllFeedEvents([])
    setConnectError(null)
  }, [])

  const refetch = useCallback(async () => {
    const stored = getStoredIcalUrl()
    if (!stored) return
    await loadFeed(stored)
  }, [loadFeed])

  return (
    <GoogleCalendarContext.Provider
      value={{
        isConnected,
        isLoading,
        events,
        todayEvents,
        upcomingEvents,
        allFeedEvents,
        isFetching,
        connectError,
        dateMode,
        setDateMode: (mode) => {
          setDateMode(mode)
          localStorage.setItem('workpilot_gcal_mode', mode)
        },
        selectedDate,
        setSelectedDate,
        rangeStart,
        setRangeStart,
        rangeEnd,
        setRangeEnd,
        saveRange,
        connect,
        disconnect,
        refetch,
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  )
}

export function useGoogleCalendar() {
  const ctx = useContext(GoogleCalendarContext)
  if (!ctx) throw new Error('useGoogleCalendar must be used within GoogleCalendarProvider')
  return ctx
}
