import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import {
  clearGmailCredentials,
  fetchGmailMessages,
  getStoredGmailCredentials,
  getStoredGmailEmail,
  isGmailConnected,
  parseGmailFeedUrl,
  saveGmailFeedUrl,
} from '@/services/email/gmailClient'
import type { EmailRecord } from '@/services/email/types'
import { buildInboxBrief, emailsToAiDocuments } from '@/services/ai/emailContext'
import { formatEmailBody, formatEmailPreview } from '@/services/email/formatEmailBody'
import type { AiEmailDocument } from '@/services/email/types'

interface GmailContextType {
  isConnected: boolean
  isLoading: boolean
  isFetching: boolean
  connectError: string | null
  emailAddress: string | null
  messages: EmailRecord[]
  unseenCount: number
  mailboxTotal: number
  connect: (feedUrl: string) => Promise<boolean>
  disconnect: () => void
  refetch: () => Promise<void>
  /** LLM-ready documents. Use this when wiring a real model. */
  aiDocuments: AiEmailDocument[]
  aiPromptBlock: string
}

const GmailContext = createContext<GmailContextType | null>(null)

export function GmailProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(isGmailConnected)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [emailAddress, setEmailAddress] = useState<string | null>(getStoredGmailEmail)
  const [messages, setMessages] = useState<EmailRecord[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [mailboxTotal, setMailboxTotal] = useState(0)

  const loadInbox = useCallback(async (email: string, appPassword: string) => {
    setIsFetching(true)
    setConnectError(null)
    try {
      const result = await fetchGmailMessages(email, appPassword)
      setMessages(result.messages)
      setUnseenCount(result.unseenCount)
      setMailboxTotal(result.mailboxTotal)
      setEmailAddress(email.trim())
      setIsConnected(true)
      return true
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Could not load Gmail.')
      setMessages([])
      setIsConnected(false)
      return false
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = getStoredGmailCredentials()
    if (!stored) {
      setIsLoading(false)
      return
    }
    void loadInbox(stored.email, stored.appPassword)
  }, [loadInbox])

  const connect = useCallback(
    async (feedUrl: string) => {
      try {
        const parsed = parseGmailFeedUrl(feedUrl)
        const ok = await loadInbox(parsed.email, parsed.appPassword)
        if (ok) saveGmailFeedUrl(feedUrl)
        return ok
      } catch (err) {
        setConnectError(err instanceof Error ? err.message : 'Could not parse the Gmail iCal URL.')
        setIsLoading(false)
        return false
      }
    },
    [loadInbox]
  )

  const disconnect = useCallback(() => {
    clearGmailCredentials()
    setIsConnected(false)
    setEmailAddress(null)
    setMessages([])
    setUnseenCount(0)
    setMailboxTotal(0)
    setConnectError(null)
  }, [])

  const refetch = useCallback(async () => {
    const stored = getStoredGmailCredentials()
    if (!stored) return
    await loadInbox(stored.email, stored.appPassword)
  }, [loadInbox])

  const readableMessages = useMemo(
    () =>
      messages.map((message) => {
        const bodyText = formatEmailBody(message.bodyText)
        return {
          ...message,
          bodyText,
          preview: formatEmailPreview(bodyText || message.preview || message.subject),
        }
      }),
    [messages]
  )

  const brief = buildInboxBrief(readableMessages)

  return (
    <GmailContext.Provider
      value={{
        isConnected,
        isLoading,
        isFetching,
        connectError,
        emailAddress,
        messages: readableMessages,
        unseenCount,
        mailboxTotal,
        connect,
        disconnect,
        refetch,
        aiDocuments: emailsToAiDocuments(readableMessages),
        aiPromptBlock: brief.promptBlock,
      }}
    >
      {children}
    </GmailContext.Provider>
  )
}

export function useGmail() {
  const ctx = useContext(GmailContext)
  if (!ctx) throw new Error('useGmail must be used within GmailProvider')
  return ctx
}
