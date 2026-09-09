import type { Task, CalendarEvent, Priority } from '@/types'
import { WORKDAY_DATE } from './taskRecommendation'
import workloadConfig from '@/data/workload.json'
import calendarData from '@/data/calendar.json'

export interface WorkloadSummary {
  taskMinutes: number
  meetingMinutes: number
  plannedMinutes: number
  workingMinutes: number
  availableMinutes: number
  isOverloaded: boolean
  deficitMinutes: number
  plannedHoursLabel: string
  availableHoursLabel: string
  todayTasks: Task[]
}

export interface DeferSuggestion {
  task: Task
  minutes: number
}

export interface DeferRecommendation {
  suggestions: DeferSuggestion[]
  totalRecoveredMinutes: number
  totalRecoveredLabel: string
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getMeetingMinutes(events: CalendarEvent[] = calendarData as CalendarEvent[]): number {
  return events.reduce((sum, event) => {
    const start = parseTimeToMinutes(event.startTime)
    const end = parseTimeToMinutes(event.endTime)
    return sum + (end - start)
  }, 0)
}

export function isTaskScheduledToday(task: Task): boolean {
  if (task.status === 'DONE') return false
  if (task.deadline > WORKDAY_DATE) return false
  const planIds = workloadConfig.planTaskIds as string[]
  if (planIds.includes(task.id)) return true
  if (task.deadline <= WORKDAY_DATE) return true
  return false
}

export function getTodayWorkloadTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskScheduledToday)
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatHoursLabel(minutes: number): string {
  const hours = minutes / 60
  if (hours % 1 === 0) return `${hours}h`
  return `${hours.toFixed(1)}h`
}

const PRIORITY_ORDER: Record<Priority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

export function calculateWorkload(tasks: Task[]): WorkloadSummary {
  const workingMinutes = workloadConfig.workingHoursMinutes
  const meetingMinutes = getMeetingMinutes()
  const todayTasks = getTodayWorkloadTasks(tasks)
  const taskMinutes = todayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const plannedMinutes = taskMinutes + meetingMinutes
  const availableMinutes = Math.max(workingMinutes - meetingMinutes, 0)
  const deficitMinutes = Math.max(taskMinutes - availableMinutes, 0)

  return {
    taskMinutes,
    meetingMinutes,
    plannedMinutes,
    workingMinutes,
    availableMinutes,
    isOverloaded: deficitMinutes > 0,
    deficitMinutes,
    plannedHoursLabel: formatHoursLabel(plannedMinutes),
    availableHoursLabel: formatHoursLabel(availableMinutes),
    todayTasks,
  }
}

export function getDeferRecommendations(tasks: Task[], deficitMinutes: number): DeferRecommendation {
  const todayTasks = getTodayWorkloadTasks(tasks)
  const candidates = todayTasks
    .filter((t) => t.status === 'TODO' && t.priority === 'LOW')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.priorityScore - b.priorityScore)

  const suggestions: DeferSuggestion[] = []
  let recovered = 0

  for (const task of candidates) {
    if (recovered >= deficitMinutes) break
    suggestions.push({ task, minutes: task.estimatedMinutes })
    recovered += task.estimatedMinutes
  }

  if (suggestions.length === 0) {
    const mediumCandidates = todayTasks
      .filter((t) => t.status === 'TODO' && t.priority === 'MEDIUM')
      .sort((a, b) => a.priorityScore - b.priorityScore)

    for (const task of mediumCandidates) {
      if (recovered >= deficitMinutes) break
      suggestions.push({ task, minutes: task.estimatedMinutes })
      recovered += task.estimatedMinutes
    }
  }

  return {
    suggestions,
    totalRecoveredMinutes: recovered,
    totalRecoveredLabel: formatDuration(recovered),
  }
}

export function getTomorrowDate(from = WORKDAY_DATE): string {
  const d = new Date(`${from}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
