import type {
  Task,
  Email,
  TeamsMessage,
  JiraTicket,
  CalendarEvent,
  Document,
  ExcelFile,
  ContextItem,
  TaskContextData,
  ContextSourceType,
} from '@/types'
import { formatShortDate } from '@/lib/utils'
import { WORKDAY_DATE } from './taskRecommendation'
import tasksData from '@/data/tasks.json'
import emailsData from '@/data/emails.json'
import teamsData from '@/data/teams.json'
import jiraData from '@/data/jira.json'
import calendarData from '@/data/calendar.json'
import documentsData from '@/data/documents.json'
import excelData from '@/data/excel.json'

const emails = emailsData as Email[]
const teams = teamsData as TeamsMessage[]
const jiraTickets = jiraData as JiraTicket[]
const calendarEvents = calendarData as CalendarEvent[]
const documents = documentsData as Document[]
const excelFiles = excelData as ExcelFile[]

function priorityLabel(priority: string): string {
  return `${priority.charAt(0)}${priority.slice(1).toLowerCase()} priority`
}

function formatCalendarTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : text
}

function deadlineLabel(deadline: string): string {
  const today = new Date(`${WORKDAY_DATE}T12:00:00`)
  const due = new Date(`${deadline}T12:00:00`)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due ${formatShortDate(deadline)}`
}

function buildJiraContext(task: Task): ContextItem | null {
  const ticket =
    jiraTickets.find((t) => t.key === task.id || t.key === task.sourceId) ??
    (task.source === 'Jira' ? jiraTickets.find((t) => t.key === task.sourceId) : null)

  if (!ticket && task.source !== 'Jira') return null

  const key = ticket?.key ?? task.sourceId
  const priority = ticket?.priority ?? task.priority

  return {
    id: `ctx-jira-${key}`,
    source: 'Jira',
    title: key,
    lines: [priorityLabel(priority), deadlineLabel(task.deadline)],
  }
}

function buildTeamsContexts(task: Task): ContextItem[] {
  const linkedIds = new Set(task.linkedItems.filter((id) => id.startsWith('teams-')))
  const messages = teams.filter(
    (m) => m.linkedTaskId === task.id || linkedIds.has(m.id)
  )

  return messages.map((m) => ({
    id: `ctx-teams-${m.id}`,
    source: 'Teams',
    title: '',
    lines: [`"${m.message}"`],
  }))
}

function buildEmailContexts(task: Task): ContextItem[] {
  const linkedIds = new Set(task.linkedItems.filter((id) => id.startsWith('email-')))
  const matched = emails.filter(
    (e) => e.linkedTaskId === task.id || linkedIds.has(e.id)
  )

  return matched.map((e) => ({
    id: `ctx-email-${e.id}`,
    source: 'Email',
    title: '',
    lines: [`"${firstSentence(e.preview)}"`],
  }))
}

function buildCalendarContexts(task: Task): ContextItem[] {
  const linkedIds = new Set(task.linkedItems.filter((id) => id.startsWith('calendar-')))
  const events = calendarEvents.filter(
    (e) => e.linkedTaskId === task.id || linkedIds.has(e.id)
  )

  return events.map((e) => ({
    id: `ctx-calendar-${e.id}`,
    source: 'Calendar',
    title: e.title,
    lines: [formatCalendarTime(e.startTime)],
  }))
}

function buildExcelContexts(task: Task): ContextItem[] {
  const linkedIds = new Set(task.linkedItems.filter((id) => id.startsWith('excel-')))
  const matched = excelFiles.filter((f) => linkedIds.has(f.id))

  if (task.source === 'Excel') {
    const file = excelFiles.find((f) => f.id === task.sourceId)
    if (file && !matched.some((m) => m.id === file.id)) {
      matched.push(file)
    }
  }

  return matched.map((f) => ({
    id: `ctx-excel-${f.id}`,
    source: 'Excel',
    title: f.name,
    lines: [f.description, f.needsReview ? 'Needs review' : 'Up to date'],
  }))
}

function buildDocumentContexts(task: Task): ContextItem[] {
  const linkedIds = new Set(task.linkedItems.filter((id) => id.startsWith('doc-')))
  const matched = documents.filter((d) => linkedIds.has(d.id))

  if (task.source === 'Documents') {
    const doc = documents.find((d) => d.id === task.sourceId)
    if (doc && !matched.some((m) => m.id === doc.id)) {
      matched.push(doc)
    }
  }

  return matched.map((d) => ({
    id: `ctx-doc-${d.id}`,
    source: 'Documents',
    title: d.name,
    lines: [`${d.type} file`, `Shared by ${d.sharedBy}`],
  }))
}

function generateAISummary(task: Task, sources: Set<ContextSourceType>): string {
  const sourceList = Array.from(sources)
  const hasClientMeeting = calendarEvents.some(
    (e) =>
      e.linkedTaskId === task.id &&
      e.title.toLowerCase().includes('client')
  )

  if (sources.has('Jira') && sources.has('Teams') && sources.has('Email') && hasClientMeeting) {
    return "This task appears across Jira, Teams and Email and is connected to today's client meeting."
  }

  if (sources.has('Jira') && sources.has('Teams') && sources.has('Email')) {
    return 'This task appears across Jira, Teams and Email with consistent context about the same issue.'
  }

  if (sources.has('Email') && sources.has('Teams')) {
    return 'This task is referenced in both email and Teams conversations and may need a coordinated response.'
  }

  if (sources.has('Jira') && sources.has('Calendar')) {
    return 'This Jira task is linked to an upcoming calendar event. Prepare updates before the meeting.'
  }

  if (sources.has('Documents')) {
    return 'This task is connected to shared documents that may contain relevant requirements or updates.'
  }

  if (sources.has('Excel')) {
    return 'This task is linked to a spreadsheet that may need review before your next deadline.'
  }

  if (sourceList.length >= 2) {
    return `This task has related activity across ${sourceList.join(', ')}. Review all sources for full context.`
  }

  if (sourceList.length === 1) {
    return `This task is primarily tracked in ${sourceList[0]}. Limited cross-source context is available.`
  }

  return 'No cross-source links found for this task yet. Related emails, messages, or meetings may appear here as they are connected.'
}

export function getTaskContext(task: Task): TaskContextData {
  const items: ContextItem[] = []
  const sources = new Set<ContextSourceType>()

  const jira = buildJiraContext(task)
  if (jira) {
    items.push(jira)
    sources.add('Jira')
  }

  for (const teamsCtx of buildTeamsContexts(task)) {
    items.push(teamsCtx)
    sources.add('Teams')
  }

  for (const emailCtx of buildEmailContexts(task)) {
    items.push(emailCtx)
    sources.add('Email')
  }

  for (const calCtx of buildCalendarContexts(task)) {
    items.push(calCtx)
    sources.add('Calendar')
  }

  for (const docCtx of buildDocumentContexts(task)) {
    items.push(docCtx)
    sources.add('Documents')
  }

  for (const excelCtx of buildExcelContexts(task)) {
    items.push(excelCtx)
    sources.add('Excel')
  }

  const sourceOrder: ContextSourceType[] = ['Jira', 'Teams', 'Email', 'Calendar', 'Documents', 'Excel']
  items.sort(
    (a, b) => sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source)
  )

  return {
    taskId: task.id,
    taskTitle: task.title,
    items,
    aiSummary: generateAISummary(task, sources),
    linkedSourceCount: sources.size,
  }
}

export function getTaskContextById(taskId: string): TaskContextData | null {
  const task = (tasksData as Task[]).find((t) => t.id === taskId)
  if (!task) return null
  return getTaskContext(task)
}
