import { extractMeetingHints } from '@/services/email/meetingHints'
import { formatEmailBody, formatEmailPreview } from '@/services/email/formatEmailBody'
import type { EmailRecord, GmailFetchResult } from '@/services/email/types'

const FEED_URL_KEY = 'workpilot_gmail_feed_url'
const EMAIL_KEY = 'workpilot_gmail_email'
const APP_PASSWORD_KEY = 'workpilot_gmail_app_password'

export function normalizeGmailFeedUrl(raw: string): string {
  return raw.trim().replace(/^webcal:/i, 'https:')
}

/**
 * Same shape as Calendar's secret iCal URL:
 * https://mail.google.com/mail/ical/you@email.com/private-YOURAPPPASSWORD/basic.ics
 */
export function parseGmailFeedUrl(raw: string): { email: string; appPassword: string } {
  const value = normalizeGmailFeedUrl(raw)
  if (!value) {
    throw new Error('Paste your Gmail iCal-style feed URL.')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('That does not look like a valid URL.')
  }

  if (url.protocol !== 'https:') {
    throw new Error('The Gmail feed URL must start with https:// or webcal://')
  }

  if (url.hostname === 'calendar.google.com') {
    throw new Error(
      'That is a Calendar iCal URL. For Gmail, use mail.google.com in the same /private-…/basic.ics format.'
    )
  }

  if (url.hostname !== 'mail.google.com') {
    throw new Error('Use a Gmail iCal-style URL on mail.google.com.')
  }

  const match = url.pathname.match(
    /\/mail\/(?:ical|feed\/atom)\/(.+)\/private-([^/]+)\/(?:basic\.ics|basic\.xml|basic\.atom)$/i
  )
  if (!match) {
    throw new Error(
      'Use the same iCal format as Calendar: https://mail.google.com/mail/ical/you@email.com/private-YOURAPPPASSWORD/basic.ics'
    )
  }

  const email = decodeURIComponent(match[1])
  const appPassword = decodeURIComponent(match[2]).replace(/\s+/g, '')
  const lowerEmail = email.toLowerCase().trim()

  if (
    lowerEmail === 'you@email.com' ||
    lowerEmail === 'you@gmail.com' ||
    lowerEmail.includes('your.email') ||
    lowerEmail.includes('youremail') ||
    lowerEmail.includes('example.com')
  ) {
    throw new Error('Replace "you@email.com" in the URL with your actual email address (e.g. hv56845@gmail.com).')
  }

  if (lowerEmail.endsWith('@email.com') || lowerEmail.endsWith('@mail.com')) {
    const suggested = email.replace(/@(email|mail)\.com$/i, '@gmail.com')
    throw new Error(`The domain "@${email.split('@')[1]}" looks like a typo. Did you mean "${suggested}"?`)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('The email in the Gmail iCal URL looks invalid.')
  }
  if (/^[0-9a-f]{32}$/i.test(appPassword)) {
    throw new Error(
      'That is a Google Calendar secret token (32 hex characters). For Gmail, generate a 16-letter App Password at myaccount.google.com/apppasswords.'
    )
  }
  if (appPassword.length < 8) {
    throw new Error('The private- token should be your Google App Password (16 characters).')
  }

  return { email, appPassword }
}

export function getStoredGmailEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function getStoredGmailFeedUrl(): string | null {
  return localStorage.getItem(FEED_URL_KEY)
}

export function getStoredGmailCredentials(): { email: string; appPassword: string } | null {
  const feedUrl = localStorage.getItem(FEED_URL_KEY)
  if (feedUrl) {
    try {
      return parseGmailFeedUrl(feedUrl)
    } catch {
      // fall through to legacy keys
    }
  }
  const email = localStorage.getItem(EMAIL_KEY)
  const appPassword = localStorage.getItem(APP_PASSWORD_KEY)
  if (!email || !appPassword) return null
  return { email, appPassword }
}

export function isGmailConnected(): boolean {
  return Boolean(getStoredGmailCredentials())
}

export function saveGmailFeedUrl(feedUrl: string): void {
  const parsed = parseGmailFeedUrl(feedUrl)
  localStorage.setItem(FEED_URL_KEY, normalizeGmailFeedUrl(feedUrl))
  localStorage.setItem(EMAIL_KEY, parsed.email)
  localStorage.setItem(APP_PASSWORD_KEY, parsed.appPassword)
}

export function clearGmailCredentials(): void {
  localStorage.removeItem(FEED_URL_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(APP_PASSWORD_KEY)
}

export async function fetchGmailMessages(email: string, appPassword: string): Promise<GmailFetchResult> {
  const response = await fetch('/api/gmail/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), appPassword: appPassword.replace(/\s+/g, ''), max: 25 }),
  })

  const payload = (await response.json().catch(() => null)) as
    | (GmailFetchResult & { error?: string })
    | { error?: string }
    | null

  if (!response.ok) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : 'Could not load Gmail.')
  }

  const result = payload as GmailFetchResult
  const messages: EmailRecord[] = (result.messages ?? []).map((message) => {
    const bodyText = formatEmailBody(message.bodyText)
    return {
      ...message,
      bodyText,
      preview: formatEmailPreview(bodyText || message.preview || message.subject),
      meetingHints: extractMeetingHints(message.subject, bodyText),
    }
  })

  return {
    messages,
    unseenCount: result.unseenCount ?? messages.filter((item) => item.isUnread).length,
    mailboxTotal: result.mailboxTotal ?? messages.length,
  }
}

export async function fetchGmailFeed(feedUrl: string): Promise<GmailFetchResult> {
  const { email, appPassword } = parseGmailFeedUrl(feedUrl)
  return fetchGmailMessages(email, appPassword)
}
