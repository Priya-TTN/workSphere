import type { Activity, Deadline, Task, CalendarEvent, TeamsMessage } from '@/types'
import type { EmailRecord } from '@/services/email/types'
import type { GoogleCalendarEvent } from '@/services/googleCalendar'
import { calculateWorkload, getDeferRecommendations } from './workloadCalculator'
import { getRecommendedTask, WORKDAY_DATE } from './taskRecommendation'
import { buildInboxBrief } from '@/services/ai/emailContext'
import { formatEventTime } from '@/services/googleCalendar'
import tasksData from '@/data/tasks.json'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'

export interface AIResponse {
  answer: string
  type: 'text' | 'list' | 'activity'
  items?: string[]
  activities?: Activity[]
}

function daysUntilDeadline(deadline: string): number {
  const today = new Date(`${WORKDAY_DATE}T12:00:00`)
  const d = new Date(`${deadline}T12:00:00`)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function getAIResponse(
  query: string,
  deadlines: Deadline[],
  activities: Activity[],
  tasks: Task[] = tasksData as Task[],
  inbox?: EmailRecord[],
  liveEvents?: GoogleCalendarEvent[]
): AIResponse {
  const q = query.toLowerCase().trim()
  const teams = teamsData as TeamsMessage[]
  const events = calendarData as CalendarEvent[]

  if (q.includes('focus') || q.includes('should i do') || q.includes('priority') || q.includes('what should')) {
    const rec = getRecommendedTask(tasks, teams, events)
    return {
      answer: rec
        ? `Your highest priority task is ${rec.task.id}. It is due ${daysUntilDeadline(rec.task.deadline) === 1 ? 'tomorrow' : 'soon'}, has high client impact and is connected to today's client meeting.`
        : 'You have no pending tasks right now.',
      type: 'text',
    }
  }

  if (q.includes('deadline') || q.includes('due') || q.includes('coming up')) {
    return {
      answer: 'Here are your upcoming deadlines:',
      type: 'list',
      items: deadlines.map((d) => `${d.date}: ${d.title} (${d.priority} priority) — ${d.source}`),
    }
  }

  if (q.includes('overload') || q.includes('available') || q.includes('hours') || q.includes('workload')) {
    const workload = calculateWorkload(tasks)
    const recCount = workload.isOverloaded
      ? getDeferRecommendations(tasks, workload.deficitMinutes).suggestions.length
      : 0
    return {
      answer: workload.isOverloaded
        ? `You currently have ${workload.plannedHoursLabel} of planned work but only ${workload.availableHoursLabel} available today. I recommend moving ${recCount} low-priority task${recCount !== 1 ? 's' : ''} to tomorrow.`
        : `Your workload is balanced today with ${workload.plannedHoursLabel} planned and ${workload.availableHoursLabel} available for focused work.`,
      type: 'text',
    }
  }

  if (q.includes('changed') || q.includes("what's new") || q.includes('updates') || q.includes('activity')) {
    return {
      answer: "Here's what changed today across your work sources:",
      type: 'activity',
      activities,
    }
  }

  if (q.includes('meeting') || q.includes('calendar')) {
    if (liveEvents && liveEvents.length > 0) {
      return {
        answer: `You have ${liveEvents.length} calendar event${liveEvents.length === 1 ? '' : 's'} in the current view:`,
        type: 'list',
        items: liveEvents.map((event) => {
          const time = formatEventTime(event.start.dateTime ?? event.start.date) || 'All day'
          return `${time}: ${event.summary}${event.location ? ` (${event.location})` : ''}`
        }),
      }
    }
    const fromMail = inbox?.filter((email) => email.meetingHints.length > 0) ?? []
    if (fromMail.length > 0) {
      return {
        answer: 'These emails look related to upcoming meetings:',
        type: 'list',
        items: fromMail.slice(0, 8).map((email) => `${email.subject} — ${email.meetingHints[0].value}`),
      }
    }
    return {
      answer:
        'You have 3 meetings today: Client Sync at 10:30 AM (Teams), Tech Discussion at 1:00 PM (Room 3), and 1:1 with Manager at 3:00 PM (Teams).',
      type: 'text',
    }
  }

  if (q.includes('email') || q.includes('inbox') || q.includes('summar')) {
    if (inbox && inbox.length > 0) {
      const brief = buildInboxBrief(inbox)
      return {
        answer: `I can read ${inbox.length} Gmail messages (${brief.unread} unread, ${brief.meetingCount} with meeting signals). Top items:`,
        type: 'list',
        items: brief.bullets,
      }
    }
    return {
      answer: 'You have 7 emails, 3 need action. The most urgent is from the client about a payment failure.',
      type: 'text',
    }
  }

  return {
    answer:
      'I can help you prioritize tasks, check deadlines, review your workload, or see what changed today. Try asking "What should I focus on today?" or "Am I overloaded?"',
    type: 'text',
  }
}
