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
import { generateBuiltInAiResponse, type ChatAction } from '@/services/ai/builtInChatbot'
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
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { generateWorkdayPdf } from '@/services/reports/workdayPdf'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  items?: string[]
  actionType?: 'pdf' | 'convert_email_tasks' | 'clear_completed'
  confidence?: 'High' | 'Medium' | 'Low'
  reasons?: string[]
  sources?: string[]
  suggestedActions?: ChatAction[]
  activeTopic?: string
}

function greeting(isConfigured: boolean) {
  return isConfigured
    ? 'I am connected to your custom LLM endpoint and can reason over Gmail, Calendar, Jira, Teams, tasks, and documents. How can I assist you?'
    : 'Hello! I am WorkPilot AI, your intelligent work assistant. I can analyze your Gmail, Calendar, Jira, Teams, tasks, and Excel files. How can I help you today?'
}

interface WorkPilotChatContextType {
  messages: ChatMessage[]
  input: string
  setInput: (value: string) => void
  loading: boolean
  isConfigured: boolean
  activeTopic: string
  sendMessage: (userMsg: string) => Promise<void>
  generatePdfReport: () => void
  clearMessages: () => void
  regenerateLastMessage: () => Promise<void>
  executeAction: (action: ChatAction) => void
}

const WorkPilotChatContext = createContext<WorkPilotChatContextType | null>(null)

export function WorkPilotChatProvider({ children }: { children: ReactNode }) {
  const { activities, tasks, addTask, updateTaskStatus, deleteTask, setStartWorkingTaskId } = useApp()
  const { messages: inbox, isConnected: gmailConnected } = useGmail()
  const { events: liveEvents, todayEvents, isConnected: calendarConnected } = useGoogleCalendar()
  const { settings, isConfigured } = useLlm()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting(isConfigured) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTopic, setActiveTopic] = useState<string>('')
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

  const clearMessages = useCallback(() => {
    setMessages([{ role: 'assistant', content: greeting(isConfigured) }])
    setActiveTopic('')
  }, [isConfigured])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev
      const next = greeting(isConfigured)
      if (prev[0].content === next) return prev
      return [{ role: 'assistant', content: next }]
    })
  }, [isConfigured])

  const executeAction = useCallback(
    (action: ChatAction) => {
      const act = action.action
      if (act === 'pdf') {
        generatePdfReport()
      } else if (act === 'start_task') {
        const t = tasks[0]
        if (t) setStartWorkingTaskId(t.id)
      } else if (act === 'convert_email_tasks') {
        const insights = extractAllMailInsights(snapshot.emails)
        insights.forEach((ins) => {
          ins.actionItems.forEach((actItem) => {
            addTask({
              title: actItem,
              description: `Extracted from email: "${ins.subject}" (${ins.from})`,
              source: 'Email',
              sourceId: ins.from,
              priority: ins.priority,
              priorityScore: ins.priority === 'HIGH' ? 85 : 50,
              deadline: new Date().toISOString().split('T')[0],
              estimatedMinutes: 30,
              status: 'TODO',
              reasons: ['Extracted from email inbox'],
              linkedItems: [],
            })
          })
        })
      } else if (act === 'copy_text' && action.payload?.text) {
        navigator.clipboard.writeText(action.payload.text)
      }
    },
    [addTask, generatePdfReport, setStartWorkingTaskId, snapshot.emails, tasks]
  )

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
          const result = generateBuiltInAiResponse(trimmed, snapshot, activeTopic)
          if (result.activeTopic) {
            setActiveTopic(result.activeTopic)
          }

          // Handle Agentic Effects live!
          if (result.agenticEffect) {
            const eff = result.agenticEffect
            if (eff.type === 'create_task' && eff.taskData) {
              addTask({
                title: eff.taskData.title || 'New Chat Task',
                description: 'Created via WorkPilot AI Chatbot',
                source: 'Internal',
                sourceId: 'chat',
                priority: eff.taskData.priority || 'HIGH',
                priorityScore: 90,
                deadline: eff.taskData.deadline || new Date().toISOString().split('T')[0],
                estimatedMinutes: 45,
                status: 'TODO',
                reasons: ['Created via WorkPilot Assistant'],
                linkedItems: [],
              })
            } else if (eff.type === 'complete_task' && eff.taskData) {
              const target = tasks.find((t) => t.id === eff.taskData.id || t.title.toLowerCase().includes(eff.taskData.id.toLowerCase()))
              if (target) updateTaskStatus(target.id, 'DONE')
            } else if (eff.type === 'delete_task' && eff.taskData) {
              const target = tasks.find((t) => t.title.toLowerCase().includes(eff.taskData.title.toLowerCase()))
              if (target) deleteTask(target.id)
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result.answer,
              items: result.items,
              actionType: result.actionType,
              confidence: result.confidence,
              reasons: result.reasons,
              sources: result.sources,
              suggestedActions: result.suggestedActions,
              activeTopic: result.activeTopic,
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
    [activeTopic, addTask, deleteTask, isConfigured, loading, settings, snapshot, tasks, updateTaskStatus]
  )

  const regenerateLastMessage = useCallback(async () => {
    const lastUserMsg = [...messagesRef.current].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      await sendMessage(lastUserMsg.content)
    }
  }, [sendMessage])

  return (
    <WorkPilotChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        loading,
        isConfigured,
        activeTopic,
        sendMessage,
        generatePdfReport,
        clearMessages,
        regenerateLastMessage,
        executeAction,
      }}
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
