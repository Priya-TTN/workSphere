export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Source = 'Jira' | 'Teams' | 'Email' | 'Calendar' | 'Excel' | 'Documents' | 'Internal'

export interface Task {
  id: string
  title: string
  description: string
  source: Source
  sourceId: string
  priority: Priority
  priorityScore: number
  deadline: string
  estimatedMinutes: number
  status: TaskStatus
  reasons: string[]
  linkedItems: string[]
}

export interface Email {
  id: string
  from: string
  subject: string
  preview: string
  receivedAt: string
  needsAction: boolean
  priority: Priority
  linkedTaskId?: string
}

export interface TeamsMessage {
  id: string
  channel: string
  author: string
  message: string
  timestamp: string
  isMention: boolean
  linkedTaskId?: string
}

export interface JiraTicket {
  id: string
  key: string
  title: string
  status: string
  priority: Priority
  assignee: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string
  source: string
  linkedTaskId?: string
}

export interface Document {
  id: string
  name: string
  type: string
  updatedAt: string
  isNew: boolean
  sharedBy: string
}

export interface ExcelFile {
  id: string
  name: string
  lastModified: string
  needsReview: boolean
  description: string
}

export interface Activity {
  id: string
  type: 'email' | 'teams' | 'jira' | 'document' | 'task'
  title: string
  description: string
  timestamp: string
  source: string
}

export interface PlanItem {
  id: string
  startTime: string
  endTime: string
  title: string
  subtitle: string
  source: Source | 'Meeting'
  priority?: Priority
}

export interface Deadline {
  id: string
  date: string
  title: string
  source: string
  priority: Priority
}

export interface User {
  name: string
  email: string
  role: string
  avatar: string
}

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'email' | 'teams' | 'jira' | 'calendar' | 'system'
}

export type ContextSourceType = 'Jira' | 'Teams' | 'Email' | 'Calendar' | 'Documents' | 'Excel'

export interface ContextItem {
  id: string
  source: ContextSourceType
  title: string
  lines: string[]
}

export interface TaskContextData {
  taskId: string
  taskTitle: string
  items: ContextItem[]
  aiSummary: string
  linkedSourceCount: number
}
