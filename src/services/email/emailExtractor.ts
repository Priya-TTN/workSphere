import type { EmailRecord } from '@/services/email/types'
import type { Priority } from '@/types'

export interface MailInsight {
  emailId: string
  from: string
  subject: string
  receivedAt: string
  priority: Priority
  isUnread: boolean
  actionItems: string[]
  meetingRequests: string[]
  keyLinks: string[]
  summary: string
}

const ACTION_PATTERNS = [
  /\b(?:please|pls)\s+(?:review|send|confirm|check|update|approve|provide|share|reply|submit)\b[^\n.?!]{0,100}/gi,
  /\b(?:action required|action item|task|deadline|due by|by EOD|by end of day|urgent|asap)\b[^\n.?!]{0,100}/gi,
  /\b(?:need your|waiting for|requires your|can you)\b[^\n.?!]{0,100}/gi,
]

const MEETING_PATTERNS = [
  /\b(?:meeting|call|sync|standup|discussion|1:1|demo|catch-up|interview)\b[^\n.?!]{0,100}/gi,
  /\b(?:scheduled for|join at|time:|calendar invite|invited you)\b[^\n.?!]{0,100}/gi,
]

const LINK_PATTERN = /https?:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|[a-z0-9-]+\.[a-z0-9-.]+)[^\s<>"']+/gi

export function extractMailInsight(email: EmailRecord): MailInsight {
  const haystack = `${email.subject}\n${email.bodyText || ''}`
  const actionItems: string[] = []
  const meetingRequests: string[] = []
  const keyLinks: string[] = []
  const seenActions = new Set<string>()
  const seenMeetings = new Set<string>()

  // 1. Action Items
  for (const pattern of ACTION_PATTERNS) {
    for (const match of haystack.matchAll(pattern)) {
      const clean = match[0].replace(/\s+/g, ' ').trim()
      if (clean.length > 8 && !seenActions.has(clean.toLowerCase())) {
        seenActions.add(clean.toLowerCase())
        actionItems.push(clean)
        if (actionItems.length >= 4) break
      }
    }
  }

  // 2. Meeting Requests
  for (const pattern of MEETING_PATTERNS) {
    for (const match of haystack.matchAll(pattern)) {
      const clean = match[0].replace(/\s+/g, ' ').trim()
      if (clean.length > 8 && !seenMeetings.has(clean.toLowerCase())) {
        seenMeetings.add(clean.toLowerCase())
        meetingRequests.push(clean)
        if (meetingRequests.length >= 3) break
      }
    }
  }

  // 3. Video / Important Links
  for (const match of haystack.matchAll(LINK_PATTERN)) {
    const url = match[0].replace(/[),.;]+$/, '')
    if (!keyLinks.includes(url)) {
      keyLinks.push(url)
      if (keyLinks.length >= 3) break
    }
  }

  // 4. Determine Priority
  const textLower = haystack.toLowerCase()
  let priority: Priority = 'LOW'
  if (
    textLower.includes('urgent') ||
    textLower.includes('asap') ||
    textLower.includes('critical') ||
    (email.isUnread && actionItems.length > 0)
  ) {
    priority = 'HIGH'
  } else if (actionItems.length > 0 || meetingRequests.length > 0 || email.isUnread) {
    priority = 'MEDIUM'
  }

  // 5. Brief Summary
  const bodyClean = (email.bodyText || email.preview || email.subject).replace(/\s+/g, ' ').trim()
  const summary = bodyClean.slice(0, 140) + (bodyClean.length > 140 ? '…' : '')

  return {
    emailId: email.id,
    from: email.from,
    subject: email.subject,
    receivedAt: email.receivedAt,
    priority,
    isUnread: email.isUnread,
    actionItems,
    meetingRequests,
    keyLinks,
    summary,
  }
}

export function extractAllMailInsights(emails: EmailRecord[]): MailInsight[] {
  return emails.map(extractMailInsight)
}
