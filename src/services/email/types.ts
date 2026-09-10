export interface MeetingHint {
  kind: 'link' | 'phrase'
  value: string
}

/** Normalized inbox message. AI should read `bodyText`, not the UI preview. */
export interface EmailRecord {
  id: string
  threadId?: string
  from: string
  fromEmail: string
  to: string[]
  subject: string
  preview: string
  /** Plain text body for LLM summarization and meeting extraction */
  bodyText: string
  receivedAt: string
  isUnread: boolean
  labels: string[]
  meetingHints: MeetingHint[]
}

export interface GmailFetchResult {
  messages: EmailRecord[]
  unseenCount: number
  mailboxTotal: number
}

/** Shape an LLM can ingest without knowing Gmail or IMAP details. */
export interface AiEmailDocument {
  source: 'gmail'
  id: string
  title: string
  timestamp: string
  text: string
  metadata: {
    from: string
    fromEmail: string
    isUnread: boolean
    labels: string[]
    meetingHints: string[]
  }
}
