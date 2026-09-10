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
  connect: (icalUrl: string) => Promise<boolean>
  disconnect: () => void
  refetch: () => Promise<void>
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | null>(null)

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(isGoogleCalendarConnected)
  const [isLoading, setIsLoading] = useState(true)
  const [icsText, setIcsText] = useState<string | null>(null)
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [todayEvents, setTodayEvents] = useState<GoogleCalendarEvent[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [dateMode, setDateMode] = useState<DateMode>('single')
  const [selectedDate, setSelectedDate] = useState<Date>(today())
  const [rangeStart, setRangeStart] = useState<Date>(today())
  const [rangeEnd, setRangeEnd] = useState<Date>(today())

  const loadFeed = useCallback(async (icalUrl: string) => {
    setIsFetching(true)
    setConnectError(null)
    try {
      const text = await fetchIcsFeed(icalUrl)
      setIcsText(text)
      setIsConnected(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load Google Calendar.'
      setConnectError(message)
      setIcsText(null)
      return false
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = getStoredIcalUrl()
    if (!stored) {
      setIsLoading(false)
      return
    }
    void loadFeed(stored)
  }, [loadFeed])

  useEffect(() => {
    if (!icsText) {
      setEvents([])
      setTodayEvents([])
      return
    }

    const start = dateMode === 'single' ? selectedDate : rangeStart
    const end = dateMode === 'single' ? selectedDate : rangeEnd
    setEvents(eventsInRange(icsText, start, end))
    setTodayEvents(eventsInRange(icsText, today(), today()))
  }, [icsText, dateMode, selectedDate, rangeStart, rangeEnd])

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
        isFetching,
        connectError,
        dateMode,
        setDateMode,
        selectedDate,
        setSelectedDate,
        rangeStart,
        setRangeStart,
        rangeEnd,
        setRangeEnd,
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
