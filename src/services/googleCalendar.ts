/**
 * Google Calendar connector using the secret iCal (.ics) address.
 *
 * Google Calendar → Settings → [calendar] → Integrate calendar
 * → "Secret address in iCal format"
 *
 * The Vite dev/preview server proxies calendar.google.com so the browser
 * can fetch the private feed without a CORS error.
 */

import { parseIcsEvents, type IcsEvent } from '@/services/icsParser'

export type GoogleCalendarEvent = IcsEvent

const ICAL_URL_KEY = 'workpilot_gcal_ical_url'

export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateInput(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatEventTime(dateTimeOrDate: string | undefined): string {
  if (!dateTimeOrDate) return ''
  if (!dateTimeOrDate.includes('T')) return 'All day'
  const d = new Date(dateTimeOrDate)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function getStoredIcalUrl(): string | null {
  return localStorage.getItem(ICAL_URL_KEY)
}

export function isGoogleCalendarConnected(): boolean {
  return Boolean(getStoredIcalUrl())
}

export function normalizeIcalUrl(raw: string): string {
  let url = raw.trim().replace(/^webcal:/i, 'https:')
  if (url.includes('/calendar/ical/') && url.includes('/private-') && !url.endsWith('.ics')) {
    url = url.endsWith('/') ? `${url}basic.ics` : `${url}/basic.ics`
  }
  return url
}

export function validateGoogleIcalUrl(raw: string): string | null {
  const value = normalizeIcalUrl(raw)
  if (!value) return 'Paste your Google Calendar secret iCal URL.'

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'That does not look like a valid URL.'
  }

  if (url.protocol !== 'https:') return 'The iCal URL must start with https:// or webcal://'
  if (url.hostname !== 'calendar.google.com') {
    return 'Use the secret iCal URL from Google Calendar (calendar.google.com).'
  }
  if (!url.pathname.includes('/calendar/ical/')) {
    return 'Use the secret address in iCal format.'
  }
  if (!url.pathname.includes('/private-')) {
    return 'Use the secret iCal address, not the public one.'
  }

  return null
}

function toProxyUrl(icalUrl: string): string {
  const url = new URL(normalizeIcalUrl(icalUrl))
  return `/api/google-ical${url.pathname}${url.search}`
}

export async function fetchIcsFeed(icalUrl: string): Promise<string> {
  const normalized = normalizeIcalUrl(icalUrl)
  const error = validateGoogleIcalUrl(normalized)
  if (error) throw new Error(error)

  const response = await fetch(toProxyUrl(normalized), {
    headers: { Accept: 'text/calendar, text/plain, */*' },
  })

  if (!response.ok) {
    let message = ''
    try {
      const data = await response.json()
      if (data && typeof data === 'object' && 'error' in data) {
        message = String(data.error)
      }
    } catch {}
    throw new Error(
      message ||
        `Google Calendar returned HTTP ${response.status}. Please check your secret iCal URL in Google Calendar settings.`
    )
  }

  const text = await response.text()
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('The URL did not return a valid calendar file. Confirm you copied the secret iCal address.')
  }

  return text
}

export function saveIcalUrl(icalUrl: string): void {
  localStorage.setItem(ICAL_URL_KEY, normalizeIcalUrl(icalUrl))
}

export function clearIcalUrl(): void {
  localStorage.removeItem(ICAL_URL_KEY)
}

export function eventsInRange(icsText: string, startDate: Date, endDate: Date): GoogleCalendarEvent[] {
  const timeMin = new Date(startDate)
  timeMin.setHours(0, 0, 0, 0)

  const timeMax = new Date(endDate)
  timeMax.setHours(23, 59, 59, 999)

  return parseIcsEvents(icsText, timeMin, timeMax)
}
