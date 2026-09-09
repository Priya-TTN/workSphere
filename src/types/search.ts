import type { Priority } from './index'

export type SearchSource =
  | 'Tasks'
  | 'Emails'
  | 'Teams'
  | 'Jira'
  | 'Calendar'
  | 'Documents'
  | 'Excel'

export interface SearchIndexItem {
  id: string
  source: SearchSource
  title: string
  description: string
  priority?: Priority
  date: string
  dateLabel: string
  route: string
  searchText: string
}

export interface UniversalAIResponse {
  answer: string
  listItems?: string[]
}

export interface UniversalSearchResponse {
  query: string
  isAIQuery: boolean
  aiResponse?: UniversalAIResponse
  results: SearchIndexItem[]
}
