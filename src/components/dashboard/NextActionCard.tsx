import { useMemo, useState } from 'react'
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Mail,
  LayoutGrid,
  Users,
  Calendar,
  Table2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import { Toast } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'
import { useTaskRecommendation } from '@/hooks/useTaskRecommendation'
import { buildRecommendationReasons } from '@/services/taskRecommendation'
import type { Source, Task } from '@/types'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'
import type { TeamsMessage, CalendarEvent } from '@/types'
import { useGmail } from '@/context/GmailContext'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { dashboardCardPadding, dashboardCardTitle } from './styles'

const sourceIcons: Record<Source, typeof Mail> = {
  Jira: LayoutGrid,
  Teams: Users,
  Email: Mail,
  Calendar: Calendar,
  Excel: Table2,
  Documents: FileText,
  Internal: FileText,
}

export function NextActionCard() {
  const recommendation = useTaskRecommendation()
  const { tasks, addTask, updateTaskStatus, addActivity, setStartWorkingTaskId, startWorkingTaskId } =
    useApp()
  const { isConnected: gmailConnected, messages } = useGmail()
  const { isConnected: calendarConnected, todayEvents } = useGoogleCalendar()
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const teamsMessages = teamsData as TeamsMessage[]
  const calendarEvents = calendarData as CalendarEvent[]

  const display = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const startedTask = startWorkingTaskId
      ? tasks.find((t) => t.id === startWorkingTaskId)
      : undefined

    const task: Task | undefined = startedTask ?? recommendation?.task
    if (task) {
      const reasons = startedTask
        ? buildRecommendationReasons(task, teamsMessages, calendarEvents)
        : recommendation?.reasons ?? []
      return { task, reasons, isSynthetic: false }
    }

    // Dynamic fallback 1: Gmail Action Items
    if (gmailConnected && messages.length > 0) {
      const insights = extractAllMailInsights(messages)
      const mailAction = insights.find((i) => i.actionItems.length > 0)
      if (mailAction) {
        const synthesizedTask: Task = {
          id: 'CLIENT-102',
          sourceId: 'CLIENT-102',
          title: mailAction.actionItems[0],
          description: `Extracted from email subject: "${mailAction.subject}" sent by ${mailAction.from}`,
          priority: mailAction.priority,
          priorityScore: 96,
          deadline: tomorrowDate,
          status: 'TODO',
          source: 'Email',
          estimatedMinutes: 60,
          reasons: ['Due tomorrow', 'High client impact', '60 minutes estimated effort'],
          linkedItems: [`Email from ${mailAction.from}`],
        }
        return { task: synthesizedTask, reasons: synthesizedTask.reasons, isSynthetic: true }
      }
    }

    // Dynamic fallback 2: Google Calendar Next Meeting
    if (calendarConnected && todayEvents.length > 0) {
      const meet = todayEvents[0]
      const synthesizedTask: Task = {
        id: 'CAL-101',
        sourceId: 'CAL-101',
        title: `Prepare for meeting: ${meet.summary}`,
        description: `Scheduled meeting on Google Calendar ${meet.location ? `@ ${meet.location}` : ''}`,
        priority: 'HIGH',
        priorityScore: 92,
        deadline: todayStr,
        status: 'TODO',
        source: 'Calendar',
        estimatedMinutes: 45,
        reasons: ['Due today', 'Connected to today\'s meeting schedule', '45 minutes estimated effort'],
        linkedItems: ['Calendar Event'],
      }
      return { task: synthesizedTask, reasons: synthesizedTask.reasons, isSynthetic: true }
    }

    // Default High-Priority Executive Recommendation Task (ANZ-342 / CLIENT-102)
    const defaultTask: Task = {
      id: 'ANZ-342',
      sourceId: 'ANZ-342',
      title: 'Resolve API deployment pipeline and release notes',
      description: 'Production payment integration fix & release blocker checklist',
      priority: 'HIGH',
      priorityScore: 96,
      deadline: tomorrowDate,
      status: 'TODO',
      source: 'Jira',
      estimatedMinutes: 60,
      reasons: ['Due tomorrow', 'High client impact', '60 minutes estimated effort', 'Current assignee'],
      linkedItems: ['Jira Ticket ANZ-342'],
    }

    return { task: defaultTask, reasons: defaultTask.reasons, isSynthetic: true }
  }, [startWorkingTaskId, tasks, recommendation, teamsMessages, calendarEvents, gmailConnected, messages, calendarConnected, todayEvents])

  const task = display.task
  const reasons = display.reasons
  const isSynthetic = display.isSynthetic
  const isInProgress = task.status === 'IN_PROGRESS' || startWorkingTaskId === task.id

  const handleStartWorking = async () => {
    if (isInProgress) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    if (isSynthetic) {
      addTask({
        title: task.title,
        description: task.description,
        source: task.source,
        sourceId: task.sourceId,
        priority: task.priority,
        priorityScore: task.priorityScore,
        deadline: task.deadline,
        estimatedMinutes: task.estimatedMinutes,
        status: 'IN_PROGRESS',
        reasons: task.reasons,
        linkedItems: task.linkedItems,
      })
    } else {
      updateTaskStatus(task.id, 'IN_PROGRESS')
    }

    setStartWorkingTaskId(task.id)
    addActivity({
      id: `activity-${Date.now()}`,
      type: 'task',
      title: 'Started working on task',
      description: `${task.id} moved to In Progress`,
      timestamp: new Date().toISOString(),
      source: 'WorkPilot AI',
    })
    setLoading(false)
    setToastVisible(true)
  }

  const SourceIcon = sourceIcons[task.source] || LayoutGrid

  return (
    <>
      <div
        className={`rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-purple-50/20 to-white ${dashboardCardPadding} h-full shadow-[0_1px_3px_rgba(124,58,237,0.08)] flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-[17px] w-[17px] text-purple-600 shrink-0" />
              <h3 className={dashboardCardTitle}>What should I do now?</h3>
            </div>
            <AIBadge label="AI Generated" />
          </div>

          <div className="mb-3.5">
            <p className="text-[17px] font-bold text-slate-900 leading-tight tracking-tight">
              Work on {task.id}
            </p>
            <p className="text-[13px] font-medium text-slate-700 mt-1 leading-snug">{task.title}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <PriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                <SourceIcon className="h-3 w-3 text-slate-500" />
                {task.source}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
              <span>Deadline: <strong className="text-slate-700">Tomorrow</strong></span>
              <span>•</span>
              <span><strong className="text-slate-700">{task.estimatedMinutes} min</strong> effort</span>
            </div>
          </div>

          <div className="rounded-xl bg-white/90 border border-purple-100/90 p-3 mb-4 shadow-2xs">
            <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-2">Why?</p>
            <ul className="space-y-1.5">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-[12px] text-slate-700 leading-snug">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          onClick={handleStartWorking}
          disabled={loading || isInProgress}
          className="w-full h-10 font-semibold shadow-md shadow-purple-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : isInProgress ? (
            'In Progress'
          ) : (
            'Start Working'
          )}
        </Button>
      </div>

      <Toast
        message={`${task.id} is now In Progress. Good luck!`}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  )
}
