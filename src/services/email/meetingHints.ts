import type { MeetingHint } from '@/services/email/types'

const MEET_LINK =
  /https?:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)[^\s<>"']+/gi

const MEET_PHRASE =
  /\b(?:meeting|call|sync|standup|1:1|interview)\b[^\n.]{0,80}(?:\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(?::\d{2})?\s?(?:am|pm))\b[^\n.]{0,40})?/gi

export function extractMeetingHints(subject: string, bodyText: string): MeetingHint[] {
  const haystack = `${subject}\n${bodyText}`
  const hints: MeetingHint[] = []
  const seen = new Set<string>()

  for (const match of haystack.matchAll(MEET_LINK)) {
    const value = match[0].replace(/[),.;]+$/, '')
    if (seen.has(value)) continue
    seen.add(value)
    hints.push({ kind: 'link', value })
  }

  for (const match of haystack.matchAll(MEET_PHRASE)) {
    const value = match[0].replace(/\s+/g, ' ').trim()
    if (value.length < 12 || seen.has(value.toLowerCase())) continue
    seen.add(value.toLowerCase())
    hints.push({ kind: 'phrase', value })
    if (hints.length >= 8) break
  }

  return hints.slice(0, 8)
}

export function isLikelyActionNeeded(subject: string, bodyText: string, isUnread: boolean): boolean {
  if (isUnread) return true
  const text = `${subject} ${bodyText}`.toLowerCase()
  return /\b(urgent|asap|action required|please review|please respond|eod|deadline|overdue|payment failure)\b/.test(
    text
  )
}
