import type { AiEmailDocument, EmailRecord } from '@/services/email/types'

/**
 * Converts inbox messages into LLM-ready documents.
 * Future AI code should call this instead of talking to Gmail/IMAP directly.
 */
export function emailsToAiDocuments(emails: EmailRecord[]): AiEmailDocument[] {
  return emails.map((email) => ({
    source: 'gmail',
    id: email.id,
    title: email.subject,
    timestamp: email.receivedAt,
    text: [
      `From: ${email.from} <${email.fromEmail}>`,
      `Subject: ${email.subject}`,
      `Received: ${email.receivedAt}`,
      email.meetingHints.length
        ? `Meeting signals: ${email.meetingHints.map((hint) => hint.value).join('; ')}`
        : '',
      '',
      email.bodyText || email.preview,
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: {
      from: email.from,
      fromEmail: email.fromEmail,
      isUnread: email.isUnread,
      labels: email.labels,
      meetingHints: email.meetingHints.map((hint) => hint.value),
    },
  }))
}

/** Single string you can drop into an LLM prompt. */
export function buildEmailPromptBlock(emails: EmailRecord[], limit = 15): string {
  const docs = emailsToAiDocuments(emails).slice(0, limit)
  if (docs.length === 0) return 'No Gmail messages are connected.'

  return [
    'Gmail inbox context for WorkPilot AI:',
    ...docs.map(
      (doc, index) =>
        `--- Email ${index + 1} (${doc.timestamp}) ---\n${doc.text}`
    ),
  ].join('\n\n')
}

export function buildInboxBrief(emails: EmailRecord[]): {
  unread: number
  actionCount: number
  meetingCount: number
  bullets: string[]
  promptBlock: string
} {
  const unread = emails.filter((email) => email.isUnread).length
  const withMeetings = emails.filter((email) => email.meetingHints.length > 0)
  const bullets = emails.slice(0, 8).map((email) => {
    const flags = [
      email.isUnread ? 'unread' : null,
      email.meetingHints.length ? 'meeting' : null,
    ]
      .filter(Boolean)
      .join(', ')
    return `${email.from}: ${email.subject}${flags ? ` (${flags})` : ''}`
  })

  return {
    unread,
    actionCount: unread,
    meetingCount: withMeetings.length,
    bullets,
    promptBlock: buildEmailPromptBlock(emails),
  }
}
