import type { Task, TeamsMessage, CalendarEvent, Priority } from '@/types'

/** Fixed reference date for deterministic MVP scoring */
export const WORKDAY_DATE = '2025-06-10'

export interface TaskRecommendation {
  task: Task
  score: number
  reasons: string[]
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  HIGH: 30,
  MEDIUM: 15,
  LOW: 5,
}

const BUSINESS_IMPACT_WEIGHT: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = {
  HIGH: 20,
  MEDIUM: 10,
  LOW: 4,
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

function daysUntilDeadline(deadline: string, today = WORKDAY_DATE): number {
  const msPerDay = 86_400_000
  const todayDate = parseDate(today)
  const deadlineDate = parseDate(deadline)
  return Math.round((deadlineDate.getTime() - todayDate.getTime()) / msPerDay)
}

function deadlineUrgencyScore(deadline: string): number {
  const days = daysUntilDeadline(deadline)
  if (days < 0) return 25
  if (days === 0) return 22
  if (days === 1) return 20
  if (days === 2) return 15
  if (days <= 5) return 10
  return 5
}

export function getBusinessImpact(task: Task): 'HIGH' | 'MEDIUM' | 'LOW' {
  const text = `${task.title} ${task.description} ${task.reasons.join(' ')}`.toLowerCase()
  if (
    text.includes('client') ||
    text.includes('production') ||
    text.includes('payment') ||
    text.includes('release blocker')
  ) {
    return 'HIGH'
  }
  if (task.priority === 'HIGH') return 'HIGH'
  if (task.priority === 'MEDIUM') return 'MEDIUM'
  return 'LOW'
}

function effortScore(minutes: number): number {
  if (minutes <= 30) return 6
  if (minutes <= 45) return 5
  if (minutes <= 60) return 3
  return 1
}

function dependencyScore(linkedCount: number): number {
  return Math.min(linkedCount * 3, 15)
}

function formatDeadlineReason(deadline: string): string {
  const days = daysUntilDeadline(deadline)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 7) return `Due in ${days} days`
  return `Due ${deadline}`
}

function formatBusinessImpactReason(impact: 'HIGH' | 'MEDIUM' | 'LOW'): string | null {
  if (impact === 'HIGH') return 'High client impact'
  if (impact === 'MEDIUM') return 'Moderate business impact'
  return null
}

export function scoreTask(
  task: Task,
  teamsMessages: TeamsMessage[],
  calendarEvents: CalendarEvent[]
): number {
  const businessImpact = getBusinessImpact(task)
  const hasMention = teamsMessages.some(
    (m) => m.isMention && m.linkedTaskId === task.id
  )
  const hasMeetingToday = calendarEvents.some((e) => e.linkedTaskId === task.id)

  return (
    PRIORITY_WEIGHT[task.priority] +
    task.priorityScore * 0.3 +
    deadlineUrgencyScore(task.deadline) +
    BUSINESS_IMPACT_WEIGHT[businessImpact] +
    effortScore(task.estimatedMinutes) +
    dependencyScore(task.linkedItems.length) +
    (hasMention ? 15 : 0) +
    (hasMeetingToday ? 12 : 0)
  )
}

export function buildRecommendationReasons(
  task: Task,
  teamsMessages: TeamsMessage[],
  calendarEvents: CalendarEvent[]
): string[] {
  const reasons: string[] = []
  const businessImpact = getBusinessImpact(task)
  const hasMention = teamsMessages.some(
    (m) => m.isMention && m.linkedTaskId === task.id
  )
  const linkedMeeting = calendarEvents.find((e) => e.linkedTaskId === task.id)

  reasons.push(formatDeadlineReason(task.deadline))

  const impactReason = formatBusinessImpactReason(businessImpact)
  if (impactReason) reasons.push(impactReason)

  if (hasMention) reasons.push('Mentioned in Teams')

  if (linkedMeeting) {
    const isClientMeeting = linkedMeeting.title.toLowerCase().includes('client')
    reasons.push(
      isClientMeeting
        ? "Connected to today's client meeting"
        : `Connected to today's ${linkedMeeting.title}`
    )
  } else if (task.linkedItems.length >= 2) {
    reasons.push('Linked across multiple work sources')
  }

  if (task.estimatedMinutes <= 60) {
    reasons.push(`${task.estimatedMinutes} minutes estimated effort`)
  } else {
    const hours = Math.round((task.estimatedMinutes / 60) * 10) / 10
    reasons.push(`${hours}h estimated effort`)
  }

  return reasons.slice(0, 5)
}

export function getRecommendedTask(
  tasks: Task[],
  teamsMessages: TeamsMessage[],
  calendarEvents: CalendarEvent[]
): TaskRecommendation | null {
  const candidates = tasks.filter((t) => t.status === 'TODO')

  if (candidates.length === 0) return null

  const scored = candidates
    .map((task) => ({
      task,
      score: scoreTask(task, teamsMessages, calendarEvents),
      reasons: buildRecommendationReasons(task, teamsMessages, calendarEvents),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.task.id.localeCompare(b.task.id)
    })

  return scored[0]
}
