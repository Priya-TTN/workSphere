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
import { formatShortDate } from '@/lib/utils'
import type { Source, Task } from '@/types'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'
import type { TeamsMessage, CalendarEvent } from '@/types'
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
  const { tasks, updateTaskStatus, addActivity, setStartWorkingTaskId, startWorkingTaskId } =
    useApp()
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const teamsMessages = teamsData as TeamsMessage[]
  const calendarEvents = calendarData as CalendarEvent[]

  const display = useMemo(() => {
    const startedTask = startWorkingTaskId
      ? tasks.find((t) => t.id === startWorkingTaskId)
      : undefined

    const task: Task | undefined = startedTask ?? recommendation?.task
    if (!task) return null

    const reasons =
      startedTask
        ? buildRecommendationReasons(task, teamsMessages, calendarEvents)
        : recommendation?.reasons ?? []

    return { task, reasons }
  }, [startWorkingTaskId, tasks, recommendation, teamsMessages, calendarEvents])

  const task = display?.task
  const reasons = display?.reasons ?? []
  const isInProgress = task?.status === 'IN_PROGRESS'

  const handleStartWorking = async () => {
    if (!task || isInProgress) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    updateTaskStatus(task.id, 'IN_PROGRESS')
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

  if (!task) {
    return (
      <div
        className={`rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50/60 via-purple-50/30 to-white ${dashboardCardPadding} h-full shadow-[0_1px_2px_rgba(124,58,237,0.06),0_4px_14px_rgba(15,23,42,0.03)]`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-[17px] w-[17px] text-purple-600 shrink-0" />
          <h3 className={dashboardCardTitle}>What should I do now?</h3>
          <AIBadge />
        </div>
        <p className="text-[13px] text-slate-500">No pending tasks. You&apos;re all caught up!</p>
      </div>
    )
  }

  const SourceIcon = sourceIcons[task.source]

  return (
    <>
      <div
        className={`rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50/60 via-purple-50/30 to-white ${dashboardCardPadding} h-full shadow-[0_1px_2px_rgba(124,58,237,0.06),0_4px_14px_rgba(15,23,42,0.03)]`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-[17px] w-[17px] text-purple-600 shrink-0" />
          <h3 className={dashboardCardTitle}>What should I do now?</h3>
          <AIBadge />
        </div>

        <div className="mb-3.5">
          <p className="text-[17px] font-bold text-slate-900 leading-tight tracking-tight">
            Work on {task.id}
          </p>
          <p className="text-[13px] text-slate-500 mt-1">{task.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <SourceIcon className="h-3 w-3 text-slate-400" />
              {task.source}
            </span>
            <span>Deadline: {formatShortDate(task.deadline)}</span>
            <span>{task.estimatedMinutes} min effort</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/70 border border-purple-100/80 p-3.5 mb-4">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-2">Why?</p>
          <ul className="space-y-1.5">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-[12px] text-slate-600 leading-snug">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleStartWorking}
          disabled={loading || isInProgress}
          className="w-full h-10"
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
