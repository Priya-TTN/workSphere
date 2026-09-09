import type { SearchIndexItem, SearchSource } from '@/types/search'
import type { Task, Email, TeamsMessage, JiraTicket, CalendarEvent, Document, ExcelFile } from '@/types'

export type SearchContext = {
  tasks?: Task[]
}
import { formatShortDate } from '@/lib/utils'
import tasksData from '@/data/tasks.json'
import emailsData from '@/data/emails.json'
import teamsData from '@/data/teams.json'
import jiraData from '@/data/jira.json'
import calendarData from '@/data/calendar.json'
import documentsData from '@/data/documents.json'
import excelData from '@/data/excel.json'

const SOURCE_ROUTES: Record<SearchSource, string> = {
  Tasks: '/tasks',
  Emails: '/emails',
  Teams: '/teams',
  Jira: '/jira',
  Calendar: '/calendar',
  Documents: '/documents',
  Excel: '/excel',
}

function formatDisplayDate(isoDate: string): string {
  if (isoDate.includes('T')) {
    const d = new Date(isoDate)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  return formatShortDate(isoDate)
}

function buildSearchText(parts: string[]): string {
  return parts.join(' ').toLowerCase()
}

function taskToIndex(task: Task): SearchIndexItem {
  return {
    id: `task-${task.id}`,
    source: 'Tasks',
    title: `${task.id}: ${task.title}`,
    description: task.description,
    priority: task.priority,
    date: task.deadline,
    dateLabel: formatDisplayDate(task.deadline),
    route: `${SOURCE_ROUTES.Tasks}?selected=${encodeURIComponent(task.id)}`,
    searchText: buildSearchText([
      task.id,
      task.title,
      task.description,
      task.source,
      task.status,
      task.priority,
      ...task.reasons,
    ]),
  }
}

function emailToIndex(email: Email): SearchIndexItem {
  return {
    id: `email-${email.id}`,
    source: 'Emails',
    title: email.subject,
    description: `${email.from} — ${email.preview}`,
    priority: email.priority,
    date: email.receivedAt,
    dateLabel: formatDisplayDate(email.receivedAt),
    route: SOURCE_ROUTES.Emails,
    searchText: buildSearchText([email.from, email.subject, email.preview, email.priority]),
  }
}

function teamsToIndex(msg: TeamsMessage): SearchIndexItem {
  return {
    id: `teams-${msg.id}`,
    source: 'Teams',
    title: msg.message,
    description: `${msg.author} in #${msg.channel}`,
    date: msg.timestamp,
    dateLabel: formatDisplayDate(msg.timestamp),
    route: SOURCE_ROUTES.Teams,
    searchText: buildSearchText([
      msg.message,
      msg.author,
      msg.channel,
      msg.isMention ? 'mention' : '',
      msg.linkedTaskId ?? '',
    ]),
  }
}

function jiraToIndex(ticket: JiraTicket): SearchIndexItem {
  return {
    id: `jira-${ticket.id}`,
    source: 'Jira',
    title: `${ticket.key}: ${ticket.title}`,
    description: `${ticket.status} · ${ticket.assignee}`,
    priority: ticket.priority,
    date: ticket.updatedAt,
    dateLabel: formatDisplayDate(ticket.updatedAt),
    route: SOURCE_ROUTES.Jira,
    searchText: buildSearchText([ticket.key, ticket.title, ticket.status, ticket.assignee, ticket.priority]),
  }
}

function calendarToIndex(event: CalendarEvent): SearchIndexItem {
  return {
    id: `calendar-${event.id}`,
    source: 'Calendar',
    title: event.title,
    description: `${event.startTime}–${event.endTime} · ${event.location}`,
    date: '2025-06-10',
    dateLabel: 'Today',
    route: SOURCE_ROUTES.Calendar,
    searchText: buildSearchText([event.title, event.location, event.startTime, event.linkedTaskId ?? '']),
  }
}

function documentToIndex(doc: Document): SearchIndexItem {
  return {
    id: `doc-${doc.id}`,
    source: 'Documents',
    title: doc.name,
    description: `${doc.type} · Shared by ${doc.sharedBy}`,
    date: doc.updatedAt,
    dateLabel: formatDisplayDate(doc.updatedAt),
    route: SOURCE_ROUTES.Documents,
    searchText: buildSearchText([doc.name, doc.type, doc.sharedBy, doc.isNew ? 'new' : '']),
  }
}

function excelToIndex(file: ExcelFile): SearchIndexItem {
  return {
    id: `excel-${file.id}`,
    source: 'Excel',
    title: file.name,
    description: file.description,
    date: file.lastModified,
    dateLabel: formatDisplayDate(file.lastModified),
    route: SOURCE_ROUTES.Excel,
    searchText: buildSearchText([
      file.name,
      file.description,
      file.needsReview ? 'needs review' : '',
    ]),
  }
}

const staticIndexItems: SearchIndexItem[] = [
  ...(emailsData as Email[]).map(emailToIndex),
  ...(teamsData as TeamsMessage[]).map(teamsToIndex),
  ...(jiraData as JiraTicket[]).map(jiraToIndex),
  ...(calendarData as CalendarEvent[]).map(calendarToIndex),
  ...(documentsData as Document[]).map(documentToIndex),
  ...(excelData as ExcelFile[]).map(excelToIndex),
]

export function buildSearchIndex(liveTasks?: Task[]): SearchIndexItem[] {
  const tasks = liveTasks ?? (tasksData as Task[])
  return [...tasks.map(taskToIndex), ...staticIndexItems]
}

export function getItemsBySource(source: SearchSource, liveTasks?: Task[]): SearchIndexItem[] {
  return buildSearchIndex(liveTasks).filter((item) => item.source === source)
}

export { SOURCE_ROUTES }
