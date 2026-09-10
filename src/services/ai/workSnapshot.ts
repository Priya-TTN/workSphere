import type { CalendarEvent, Email } from '@/types'
import type { EmailRecord } from '@/services/email/types'
import type { GoogleCalendarEvent } from '@/services/googleCalendar'

export function mockEmailsToRecords(emails: Email[]): EmailRecord[] {
  return emails.map((email) => ({
    id: email.id,
    from: email.from,
    fromEmail: '',
    to: [],
    subject: email.subject,
    preview: email.preview,
    bodyText: email.preview,
    receivedAt: email.receivedAt,
    isUnread: email.needsAction,
    labels: [],
    meetingHints: [],
  }))
}

export function mockEventsToGoogle(events: CalendarEvent[]): GoogleCalendarEvent[] {
  const day = new Date().toISOString().slice(0, 10)
  return events.map((event) => ({
    id: event.id,
    uid: event.id,
    summary: event.title,
    location: event.location,
    start: { dateTime: `${day}T${event.startTime}:00` },
    end: { dateTime: `${day}T${event.endTime}:00` },
    status: 'confirmed',
  }))
}
