import type { Activity, Deadline, JiraTicket, Task, TeamsMessage } from '@/types'
import type { EmailRecord } from '@/services/email/types'
import type { GoogleCalendarEvent } from '@/services/googleCalendar'
import { formatEventTime } from '@/services/googleCalendar'

export interface WorkSnapshot {
  now: string
  gmailConnected: boolean
  calendarConnected: boolean
  emails: EmailRecord[]
  events: GoogleCalendarEvent[]
  tasks: Task[]
  jira: JiraTicket[]
  teams: TeamsMessage[]
  deadlines: Deadline[]
  activities: Activity[]
}

export interface ContextEntity {
  type: string
  value: string
  sources: string[]
}

export interface ContextGraph {
  people: ContextEntity[]
  projects: ContextEntity[]
  clients: ContextEntity[]
  tasks: ContextEntity[]
  deadlines: ContextEntity[]
  priorities: ContextEntity[]
  decisions: ContextEntity[]
  commitments: ContextEntity[]
  questions: ContextEntity[]
  blockers: ContextEntity[]
  dependencies: ContextEntity[]
  risks: ContextEntity[]
  requests: ContextEntity[]
  followUps: ContextEntity[]
  relationships: ContextEntity[]
}

const TICKET = /\b([A-Z]{2,6}-\d+)\b/g
const PERSON = /\b(?:from|by|author|assignee)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/g

function add(map: Map<string, ContextEntity>, type: string, value: string, source: string) {
  const key = value.trim()
  if (!key || key.length < 2) return
  const existing = map.get(key.toLowerCase())
  if (existing) {
    if (!existing.sources.includes(source)) existing.sources.push(source)
    return
  }
  map.set(key.toLowerCase(), { type, value: key, sources: [source] })
}

function collect(map: Map<string, ContextEntity>): ContextEntity[] {
  return [...map.values()].slice(0, 25)
}

function scanText(text: string, source: string, buckets: Record<string, Map<string, ContextEntity>>) {
  const lower = text.toLowerCase()
  for (const match of text.matchAll(TICKET)) {
    add(buckets.projects, 'project', match[1], source)
    add(buckets.tasks, 'task', match[1], source)
  }
  for (const match of text.matchAll(PERSON)) {
    add(buckets.people, 'person', match[1], source)
  }
  if (/\bclient\b/i.test(text)) {
    const client = text.match(/client[:\s-]+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)?)/)
    if (client) add(buckets.clients, 'client', client[1], source)
  }
  if (/\b(blocked|blocker|waiting on|cannot proceed)\b/i.test(lower)) {
    add(buckets.blockers, 'blocker', text.slice(0, 140), source)
  }
  if (/\b(risk|urgent|asap|failure|outage)\b/i.test(lower)) {
    add(buckets.risks, 'risk', text.slice(0, 140), source)
  }
  if (/\b(please|can you|could you|need you to)\b/i.test(lower)) {
    add(buckets.requests, 'request', text.slice(0, 140), source)
  }
  if (/\b(follow[- ]?up|reminder|ping)\b/i.test(lower)) {
    add(buckets.followUps, 'follow-up', text.slice(0, 140), source)
  }
  if (/\b(decided|agreed|we will|decision)\b/i.test(lower)) {
    add(buckets.decisions, 'decision', text.slice(0, 140), source)
  }
  if (/\b(i will|i'll|by eod|commit to)\b/i.test(lower)) {
    add(buckets.commitments, 'commitment', text.slice(0, 140), source)
  }
  if (text.includes('?')) {
    const question = text.split(/[.!]/).find((part) => part.includes('?'))
    if (question) add(buckets.questions, 'question', question.trim().slice(0, 140), source)
  }
  if (/\b(depend|blocked by|waiting for|linked)\b/i.test(lower)) {
    add(buckets.dependencies, 'dependency', text.slice(0, 140), source)
  }
}

export function buildContextGraph(snapshot: WorkSnapshot): ContextGraph {
  const buckets = {
    people: new Map<string, ContextEntity>(),
    projects: new Map<string, ContextEntity>(),
    clients: new Map<string, ContextEntity>(),
    tasks: new Map<string, ContextEntity>(),
    deadlines: new Map<string, ContextEntity>(),
    priorities: new Map<string, ContextEntity>(),
    decisions: new Map<string, ContextEntity>(),
    commitments: new Map<string, ContextEntity>(),
    questions: new Map<string, ContextEntity>(),
    blockers: new Map<string, ContextEntity>(),
    dependencies: new Map<string, ContextEntity>(),
    risks: new Map<string, ContextEntity>(),
    requests: new Map<string, ContextEntity>(),
    followUps: new Map<string, ContextEntity>(),
    relationships: new Map<string, ContextEntity>(),
  }

  for (const email of snapshot.emails) {
    add(buckets.people, 'person', email.from, 'gmail')
    scanText(`${email.subject}\n${email.bodyText}`, 'gmail', buckets)
  }
  for (const event of snapshot.events) {
    const who = event.attendees?.[0]?.displayName || event.attendees?.[0]?.email || ''
    add(buckets.people, 'person', who, 'calendar')
    scanText(`${event.summary}\n${event.description ?? ''}`, 'calendar', buckets)
  }
  for (const task of snapshot.tasks) {
    add(buckets.tasks, 'task', `${task.id}: ${task.title}`, 'tasks')
    add(buckets.priorities, 'priority', `${task.id} ${task.priority}`, 'tasks')
    add(buckets.deadlines, 'deadline', `${task.deadline} — ${task.title}`, 'tasks')
    if (task.status !== 'DONE' && /block/i.test(task.title + task.description)) {
      add(buckets.blockers, 'blocker', task.title, 'tasks')
    }
    for (const linked of task.linkedItems) {
      add(buckets.relationships, 'relationship', `${task.id} linked to ${linked}`, 'tasks')
    }
    scanText(`${task.title}\n${task.description}\n${task.reasons.join(' ')}`, 'tasks', buckets)
  }
  for (const ticket of snapshot.jira) {
    add(buckets.projects, 'project', ticket.key, 'jira')
    add(buckets.people, 'person', ticket.assignee, 'jira')
    add(buckets.tasks, 'task', `${ticket.key}: ${ticket.title} (${ticket.status})`, 'jira')
  }
  for (const msg of snapshot.teams) {
    add(buckets.people, 'person', msg.author, 'teams')
    if (msg.linkedTaskId) add(buckets.relationships, 'relationship', `${msg.id} → ${msg.linkedTaskId}`, 'teams')
    scanText(msg.message, 'teams', buckets)
  }
  for (const deadline of snapshot.deadlines) {
    add(buckets.deadlines, 'deadline', `${deadline.date}: ${deadline.title}`, deadline.source)
  }

  return {
    people: collect(buckets.people),
    projects: collect(buckets.projects),
    clients: collect(buckets.clients),
    tasks: collect(buckets.tasks),
    deadlines: collect(buckets.deadlines),
    priorities: collect(buckets.priorities),
    decisions: collect(buckets.decisions),
    commitments: collect(buckets.commitments),
    questions: collect(buckets.questions),
    blockers: collect(buckets.blockers),
    dependencies: collect(buckets.dependencies),
    risks: collect(buckets.risks),
    requests: collect(buckets.requests),
    followUps: collect(buckets.followUps),
    relationships: collect(buckets.relationships),
  }
}

export function buildWorkContextPrompt(snapshot: WorkSnapshot): string {
  const graph = buildContextGraph(snapshot)
  const emailLines = snapshot.emails.slice(0, 12).map((email) => {
    const body = (email.bodyText || email.preview).slice(0, 400)
    return `- [${email.receivedAt}] ${email.from} | ${email.subject}${email.isUnread ? ' (unread)' : ''}\n  ${body}`
  })
  const eventLines = snapshot.events.slice(0, 15).map((event) => {
    const time = formatEventTime(event.start.dateTime ?? event.start.date) || 'All day'
    return `- ${time}: ${event.summary}${event.location ? ` @ ${event.location}` : ''}`
  })
  const taskLines = snapshot.tasks.map(
    (task) =>
      `- ${task.id} [${task.status}/${task.priority}] due ${task.deadline}: ${task.title} — ${task.description}`
  )
  const jiraLines = snapshot.jira.map(
    (ticket) => `- ${ticket.key} [${ticket.status}/${ticket.priority}] ${ticket.title}`
  )
  const teamLines = snapshot.teams.map(
    (msg) => `- ${msg.timestamp} #${msg.channel} ${msg.author}: ${msg.message}`
  )

  return [
    `Now: ${snapshot.now}`,
    `Gmail connected: ${snapshot.gmailConnected}`,
    `Calendar connected: ${snapshot.calendarConnected}`,
    '',
    '## Calendar',
    eventLines.join('\n') || '- No calendar events loaded.',
    '',
    '## Emails',
    emailLines.join('\n') || '- No emails loaded.',
    '',
    '## Tasks',
    taskLines.join('\n'),
    '',
    '## Jira',
    jiraLines.join('\n'),
    '',
    '## Teams',
    teamLines.join('\n'),
    '',
    '## Deadlines',
    snapshot.deadlines.map((item) => `- ${item.date}: ${item.title} (${item.priority})`).join('\n'),
    '',
    '## Context engine',
    JSON.stringify(graph, null, 2),
  ].join('\n')
}

export const WORKPILOT_SYSTEM_PROMPT = `You are WorkPilot, an AI work assistant for one employee.
Reason only over the provided work context (email, calendar, tasks, Jira, Teams).
Be concise, specific, and actionable. Prefer named tickets, people, and times.
If data is missing, say so and use demo/task data that is present.

You can answer:
- What should I do today / first / right now?
- What is most urgent or overdue?
- What am I waiting for, what is blocking me?
- What changed since yesterday / while I was away?
- Upcoming deadlines and meetings
- How busy am I, which tasks can I postpone
- Related, duplicate, or blocked tasks
- What was discussed/decided, what the client or manager asked
- Show everything related to a project or ticket (e.g. ANZ-342)
- Summarize the workday / prepare a daily briefing

When listing work, order by urgency. Use short bullets.`
