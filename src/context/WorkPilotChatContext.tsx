import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { generateBuiltInAiResponse } from '@/services/ai/builtInChatbot'
import { chatWithLlm } from '@/services/ai/llmClient'
import { WORKPILOT_SYSTEM_PROMPT, buildWorkContextPrompt, type WorkSnapshot } from '@/services/ai/contextEngine'
import { mockEmailsToRecords, mockEventsToGoogle } from '@/services/ai/workSnapshot'
import { useApp } from '@/context/AppContext'
import { useGmail } from '@/context/GmailContext'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import { useLlm } from '@/context/LlmContext'
import deadlinesData from '@/data/deadlines.json'
import emailsData from '@/data/emails.json'
import jiraData from '@/data/jira.json'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'
import type { CalendarEvent, Deadline, Email, JiraTicket, TeamsMessage } from '@/types'

import { generateWorkdayPdf } from '@/services/reports/workdayPdf'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  items?: string[]
  actionType?: 'pdf' | 'convert_email_tasks' | 'clear_completed'
}

function greeting(isConfigured: boolean) {
  return isConfigured
    ? 'I am connected to your custom LLM endpoint and can reason over Gmail, Calendar, Jira, Teams, and tasks. What do you need?'
    : 'Hello! I am WorkPilot AI, your intelligent built-in work assistant. I analyze your Gmail, Calendar, Jira, Teams, tasks, and workday data. How can I help you today?'
}

interface WorkPilotChatContextType {
  messages: ChatMessage[]
  input: string
  setInput: (value: string) => void
  loading: boolean
  isConfigured: boolean
  sendMessage: (userMsg: string) => Promise<void>
  generatePdfReport: () => void
}

const WorkPilotChatContext = createContext<WorkPilotChatContextType | null>(null)

export function WorkPilotChatProvider({ children }: { children: ReactNode }) {
  const { activities, tasks } = useApp()
  const { messages: inbox, isConnected: gmailConnected } = useGmail()
  const { events: liveEvents, todayEvents, isConnected: calendarConnected } = useGoogleCalendar()
  const { settings, isConfigured } = useLlm()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting(isConfigured) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const snapshot = useMemo<WorkSnapshot>(() => {
    const calendarEvents =
      calendarConnected && (liveEvents.length > 0 || todayEvents.length > 0)
        ? liveEvents.length > 0
          ? liveEvents
          : todayEvents
        : mockEventsToGoogle(calendarData as CalendarEvent[])
    return {
      now: new Date().toISOString(),
      gmailConnected,
      calendarConnected,
      emails: gmailConnected && inbox.length > 0 ? inbox : mockEmailsToRecords(emailsData as Email[]),
      events: calendarEvents,
      tasks,
      jira: jiraData as JiraTicket[],
      teams: teamsData as TeamsMessage[],
      deadlines: deadlinesData as Deadline[],
      activities,
    }
  }, [activities, calendarConnected, gmailConnected, inbox, liveEvents, tasks, todayEvents])

  const generatePdfReport = useCallback(() => {
    generateWorkdayPdf(snapshot)
  }, [snapshot])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev
      const next = greeting(isConfigured)
      if (prev[0].content === next) return prev
      return [{ role: 'assistant', content: next }]
    })
  }, [isConfigured])

  const sendMessage = useCallback(
    async (userMsg: string) => {
      const trimmed = userMsg.trim()
      if (!trimmed || loading) return
      setInput('')
      const history: ChatMessage[] = [...messagesRef.current, { role: 'user', content: trimmed }]
      setMessages(history)
      setLoading(true)
      try {
        if (isConfigured) {
          const context = buildWorkContextPrompt(snapshot)
          const llmMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: `${WORKPILOT_SYSTEM_PROMPT}\n\n${context}` },
            ...history
              .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
              .slice(-8)
              .map((msg) => ({ role: msg.role, content: msg.content })),
          ]
          const content = await chatWithLlm(settings, llmMessages)
          setMessages((prev) => [...prev, { role: 'assistant', content }])
          if (trimmed.toLowerCase().includes('pdf')) {
            generateWorkdayPdf(snapshot)
          }
        } else {
          const result = generateBuiltInAiResponse(trimmed, snapshot)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result.answer,
              items: result.items,
              actionType: result.actionType,
            },
          ])
          if (result.actionType === 'pdf') {
            generateWorkdayPdf(snapshot)
          }
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: err instanceof Error ? err.message : 'The assistant could not complete that request.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [isConfigured, loading, settings, snapshot]
  )

  return (
    <WorkPilotChatContext.Provider
      value={{ messages, input, setInput, loading, isConfigured, sendMessage, generatePdfReport }}
    >
      {children}
    </WorkPilotChatContext.Provider>
  )
}

export function useWorkPilotChat() {
  const ctx = useContext(WorkPilotChatContext)
  if (!ctx) throw new Error('useWorkPilotChat must be used within WorkPilotChatProvider')
  return ctx
}
