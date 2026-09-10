/**
 * Minimal iCalendar (RFC 5545) parser for Google Calendar secret .ics feeds.
 * Expands common RRULE patterns so weekly/daily meetings show on the right days.
 */

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const
const MAX_OCCURRENCES = 400

export interface IcsAttendee {
  email: string
  displayName?: string
  responseStatus: string
}

export interface IcsEvent {
  id: string
  uid: string
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: IcsAttendee[]
  htmlLink?: string
  status: string
}

interface RawEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  htmlLink?: string
  status: string
  attendees: IcsAttendee[]
  startMs: number
  endMs: number
  allDay: boolean
  durationMs: number
  rrule?: string
  exdates: Set<string>
  recurrenceIdKey?: string
}

interface Prop {
  name: string
  params: Record<string, string>
  value: string
}

function unfold(ics: string): string[] {
  const normalized = ics.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const raw = normalized.split('\n')
  const lines: string[] = []
  for (const line of raw) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (lines.length === 0) continue
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
  }
  return lines.filter((line) => line.length > 0)
}

function unescapeIcs(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function parseProp(line: string): Prop {
  const colon = line.indexOf(':')
  const meta = colon === -1 ? line : line.slice(0, colon)
  const value = colon === -1 ? '' : line.slice(colon + 1)
  const [name, ...paramParts] = meta.split(';')
  const params: Record<string, string> = {}
  for (const part of paramParts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name: name.toUpperCase(), params, value }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseIcsDate(value: string, params: Record<string, string>): { ms: number; allDay: boolean } {
  const isDate = params.VALUE === 'DATE' || /^\d{8}$/.test(value)
  if (isDate) {
    const y = Number(value.slice(0, 4))
    const m = Number(value.slice(4, 6)) - 1
    const d = Number(value.slice(6, 8))
    return { ms: new Date(y, m, d).getTime(), allDay: true }
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/)
  if (!match) {
    const fallback = Date.parse(value)
    return { ms: Number.isNaN(fallback) ? Date.now() : fallback, allDay: false }
  }

  const [, ys, ms, ds, hs, mins, ss, z] = match
  if (z) {
    return {
      ms: Date.UTC(Number(ys), Number(ms) - 1, Number(ds), Number(hs), Number(mins), Number(ss)),
      allDay: false,
    }
  }

  return {
    ms: new Date(Number(ys), Number(ms) - 1, Number(ds), Number(hs), Number(mins), Number(ss)).getTime(),
    allDay: false,
  }
}

function occurrenceKey(ms: number, allDay: boolean): string {
  const d = new Date(ms)
  return allDay
    ? localDateKey(d)
    : `${localDateKey(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function parseAttendee(prop: Prop): IcsAttendee | null {
  const email = prop.value.replace(/^mailto:/i, '').trim()
  if (!email) return null
  const partstat = (prop.params.PARTSTAT ?? 'NEEDS-ACTION').toLowerCase()
  return {
    email,
    displayName: prop.params.CN,
    responseStatus: partstat,
  }
}

function parseRrule(rrule: string): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const piece of rrule.split(';')) {
    const eq = piece.indexOf('=')
    if (eq === -1) continue
    parts[piece.slice(0, eq).toUpperCase()] = piece.slice(eq + 1)
  }
  return parts
}

function parseByDay(value: string | undefined): { nth: number; weekday: number }[] {
  if (!value) return []
  return value.split(',').map((token) => {
    const match = token.trim().match(/^([+-]?\d{0,2})(SU|MO|TU|WE|TH|FR|SA)$/)
    if (!match) return { nth: 0, weekday: 0 }
    return {
      nth: match[1] ? Number(match[1]) : 0,
      weekday: WEEKDAYS.indexOf(match[2] as (typeof WEEKDAYS)[number]),
    }
  })
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  const day = next.getDate()
  next.setMonth(next.getMonth() + months)
  if (next.getDate() !== day) next.setDate(0)
  return next
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number, hours: number, minutes: number, seconds: number): Date | null {
  if (nth > 0) {
    const first = new Date(year, month, 1, hours, minutes, seconds)
    const offset = (weekday - first.getDay() + 7) % 7
    const day = 1 + offset + (nth - 1) * 7
    const result = new Date(year, month, day, hours, minutes, seconds)
    if (result.getMonth() !== month) return null
    return result
  }

  const last = new Date(year, month + 1, 0, hours, minutes, seconds)
  const offset = (last.getDay() - weekday + 7) % 7
  const day = last.getDate() - offset + (nth + 1) * 7
  const result = new Date(year, month, day, hours, minutes, seconds)
  if (result.getMonth() !== month) return null
  return result
}

function nextOccurrence(current: Date, freq: string, interval: number, bydays: { nth: number; weekday: number }[]): Date | null {
  if (freq === 'DAILY') {
    const next = new Date(current)
    next.setDate(next.getDate() + interval)
    return next
  }

  if (freq === 'WEEKLY') {
    if (bydays.length === 0) {
      const next = new Date(current)
      next.setDate(next.getDate() + 7 * interval)
      return next
    }
    const ordered = [...bydays].sort((a, b) => a.weekday - b.weekday)
    for (const day of ordered) {
      if (day.weekday > current.getDay()) {
        const next = new Date(current)
        next.setDate(next.getDate() + (day.weekday - current.getDay()))
        return next
      }
    }
    const first = ordered[0]
    const next = new Date(current)
    next.setDate(next.getDate() + (7 * interval - current.getDay() + first.weekday))
    return next
  }

  if (freq === 'MONTHLY') {
    if (bydays.length === 1 && bydays[0].nth !== 0) {
      const probe = addMonths(current, interval)
      return nthWeekdayOfMonth(
        probe.getFullYear(),
        probe.getMonth(),
        bydays[0].weekday,
        bydays[0].nth,
        current.getHours(),
        current.getMinutes(),
        current.getSeconds()
      )
    }
    return addMonths(current, interval)
  }

  if (freq === 'YEARLY') {
    const next = new Date(current)
    next.setFullYear(next.getFullYear() + interval)
    return next
  }

  return null
}

function firstWeeklyOccurrence(start: Date, bydays: { nth: number; weekday: number }[]): Date {
  if (bydays.length === 0) return new Date(start)
  const match = bydays.find((day) => day.weekday === start.getDay())
  if (match) return new Date(start)
  const ordered = [...bydays].sort((a, b) => a.weekday - b.weekday)
  for (const day of ordered) {
    if (day.weekday > start.getDay()) {
      const next = new Date(start)
      next.setDate(next.getDate() + (day.weekday - start.getDay()))
      return next
    }
  }
  const first = ordered[0]
  const next = new Date(start)
  next.setDate(next.getDate() + (7 - start.getDay() + first.weekday))
  return next
}

function toEvent(raw: RawEvent, startMs: number, endMs: number): IcsEvent {
  const start = new Date(startMs)
  const end = new Date(endMs)
  return {
    id: `${raw.uid}-${occurrenceKey(startMs, raw.allDay)}`,
    uid: raw.uid,
    summary: raw.summary,
    description: raw.description,
    location: raw.location,
    htmlLink: raw.htmlLink,
    status: raw.status,
    attendees: raw.attendees.length > 0 ? raw.attendees : undefined,
    start: raw.allDay
      ? { date: localDateKey(start) }
      : { dateTime: start.toISOString() },
    end: raw.allDay
      ? { date: localDateKey(end) }
      : { dateTime: end.toISOString() },
  }
}

function overlaps(startMs: number, endMs: number, rangeStart: number, rangeEnd: number): boolean {
  return startMs < rangeEnd && endMs > rangeStart
}

function expandRawEvent(raw: RawEvent, rangeStart: number, rangeEnd: number, exceptionKeys: Set<string>): IcsEvent[] {
  if (!raw.rrule) {
    if (raw.recurrenceIdKey) {
      return overlaps(raw.startMs, raw.endMs, rangeStart, rangeEnd) ? [toEvent(raw, raw.startMs, raw.endMs)] : []
    }
    return overlaps(raw.startMs, raw.endMs, rangeStart, rangeEnd) ? [toEvent(raw, raw.startMs, raw.endMs)] : []
  }

  const rule = parseRrule(raw.rrule)
  const freq = (rule.FREQ ?? 'DAILY').toUpperCase()
  const interval = Math.max(1, Number(rule.INTERVAL ?? '1') || 1)
  const count = rule.COUNT ? Number(rule.COUNT) : undefined
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, {}).ms : undefined
  const bydays = parseByDay(rule.BYDAY)
  const events: IcsEvent[] = []

  let current = freq === 'WEEKLY' ? firstWeeklyOccurrence(new Date(raw.startMs), bydays) : new Date(raw.startMs)
  let produced = 0

  while (produced < MAX_OCCURRENCES) {
    const startMs = current.getTime()
    if (until !== undefined && startMs > until) break
    if (count !== undefined && produced >= count) break
    if (startMs > rangeEnd + raw.durationMs) break

    const endMs = startMs + raw.durationMs
    const key = `${raw.uid}:${occurrenceKey(startMs, raw.allDay)}`
    const excluded = raw.exdates.has(occurrenceKey(startMs, raw.allDay)) || exceptionKeys.has(key)

    if (!excluded && startMs >= raw.startMs - 1000 && overlaps(startMs, endMs, rangeStart, rangeEnd)) {
      events.push(toEvent(raw, startMs, endMs))
    }

    produced += 1
    const next = nextOccurrence(current, freq, interval, bydays)
    if (!next || next.getTime() <= startMs) break
    current = next
  }

  return events
}

function parseVEvents(ics: string): RawEvent[] {
  const lines = unfold(ics)
  const events: RawEvent[] = []
  let current: Prop[] | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = []
      continue
    }
    if (line === 'END:VEVENT' && current) {
      const mapped = buildRawEvent(current)
      if (mapped) events.push(mapped)
      current = null
      continue
    }
    if (current) current.push(parseProp(line))
  }

  return events
}

function buildRawEvent(props: Prop[]): RawEvent | null {
  const map = new Map<string, Prop[]>()
  for (const prop of props) {
    const list = map.get(prop.name) ?? []
    list.push(prop)
    map.set(prop.name, list)
  }

  const dtStart = map.get('DTSTART')?.[0]
  if (!dtStart) return null

  const start = parseIcsDate(dtStart.value, dtStart.params)
  const dtEnd = map.get('DTEND')?.[0]
  const endMs = dtEnd
    ? parseIcsDate(dtEnd.value, dtEnd.params).ms
    : start.ms + (start.allDay ? 86400000 : 3600000)
  const durationMs = Math.max(endMs - start.ms, start.allDay ? 86400000 : 15 * 60 * 1000)

  const uid = map.get('UID')?.[0]?.value ?? `event-${start.ms}`
  const summary = unescapeIcs(map.get('SUMMARY')?.[0]?.value ?? '(No title)')
  const description = map.get('DESCRIPTION')?.[0]?.value
    ? unescapeIcs(map.get('DESCRIPTION')![0].value)
    : undefined
  const location = map.get('LOCATION')?.[0]?.value
    ? unescapeIcs(map.get('LOCATION')![0].value)
    : undefined
  const htmlLink = map.get('URL')?.[0]?.value
  const status = (map.get('STATUS')?.[0]?.value ?? 'CONFIRMED').toLowerCase()
  const attendees = (map.get('ATTENDEE') ?? [])
    .map(parseAttendee)
    .filter((item): item is IcsAttendee => item !== null)

  const recurrenceId = map.get('RECURRENCE-ID')?.[0]
  const recurrenceIdKey = recurrenceId
    ? occurrenceKey(parseIcsDate(recurrenceId.value, recurrenceId.params).ms, recurrenceId.params.VALUE === 'DATE')
    : undefined

  const exdates = new Set<string>()
  for (const prop of map.get('EXDATE') ?? []) {
    for (const value of prop.value.split(',')) {
      const parsed = parseIcsDate(value.trim(), prop.params)
      exdates.add(occurrenceKey(parsed.ms, parsed.allDay || prop.params.VALUE === 'DATE'))
    }
  }

  return {
    uid,
    summary,
    description,
    location,
    htmlLink,
    status,
    attendees,
    startMs: start.ms,
    endMs: start.ms + durationMs,
    allDay: start.allDay,
    durationMs,
    rrule: map.get('RRULE')?.[0]?.value,
    exdates,
    recurrenceIdKey,
  }
}

export function parseIcsEvents(ics: string, rangeStart: Date, rangeEnd: Date): IcsEvent[] {
  const startMs = rangeStart.getTime()
  const endMs = rangeEnd.getTime()
  const rawEvents = parseVEvents(ics)
  const exceptionKeys = new Set(
    rawEvents
      .filter((event) => event.recurrenceIdKey)
      .map((event) => `${event.uid}:${event.recurrenceIdKey}`)
  )

  const expanded = rawEvents.flatMap((event) => expandRawEvent(event, startMs, endMs, exceptionKeys))
  expanded.sort((a, b) => {
    const aStart = a.start.dateTime ?? a.start.date ?? ''
    const bStart = b.start.dateTime ?? b.start.date ?? ''
    return aStart.localeCompare(bStart)
  })
  return expanded
}
