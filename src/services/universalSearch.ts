import type { UniversalSearchResponse, SearchIndexItem, SearchSource } from '@/types/search'
import type { Task, TeamsMessage, Activity } from '@/types'
import { buildSearchIndex, getItemsBySource, type SearchContext } from './searchIndex'
import { getRecommendedTask, WORKDAY_DATE } from './taskRecommendation'
import { calculateWorkload, getDeferRecommendations } from './workloadCalculator'
import tasksData from '@/data/tasks.json'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'
import activitiesData from '@/data/activities.json'
import deadlinesData from '@/data/deadlines.json'
import type { CalendarEvent, Deadline } from '@/types'

const EXAMPLE_QUERIES = [
  'What should I focus on today?',
  'What are my deadlines?',
  'Show Jira tasks',
  'What changed today?',
  'Am I overloaded?',
  'Show tasks mentioned in Teams',
  'Which tasks are due tomorrow?',
]

function normalize(query: string): string {
  return query.toLowerCase().trim()
}

function tokenize(query: string): string[] {
  return normalize(query).split(/\s+/).filter((t) => t.length > 1)
}

function daysUntilDeadline(deadline: string): number {
  const today = new Date(`${WORKDAY_DATE}T12:00:00`)
  const d = new Date(`${deadline}T12:00:00`)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function scoreItem(item: SearchIndexItem, tokens: string[], fullQuery: string): number {
  const text = item.searchText
  let score = 0

  if (text.includes(fullQuery)) score += 50
  if (item.title.toLowerCase().includes(fullQuery)) score += 30

  for (const token of tokens) {
    if (text.includes(token)) score += 10
    if (item.title.toLowerCase().includes(token)) score += 5
    if (item.source.toLowerCase().includes(token)) score += 8
  }

  if (item.priority === 'HIGH') score += 2
  return score
}

function keywordSearch(query: string, limit = 8, context?: SearchContext): SearchIndexItem[] {
  const q = normalize(query)
  if (!q) return []

  const tokens = tokenize(query)
  const index = buildSearchIndex(context?.tasks)

  return index
    .map((item) => ({ item, score: scoreItem(item, tokens, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

function tasksDueTomorrow(context?: SearchContext): SearchIndexItem[] {
  const tasks = context?.tasks ?? (tasksData as Task[])
  const index = buildSearchIndex(context?.tasks)
  const tomorrowIds = new Set(
    tasks.filter((t) => daysUntilDeadline(t.deadline) === 1).map((t) => t.id)
  )
  return index.filter(
    (item) => item.source === 'Tasks' && tomorrowIds.has(item.title.split(':')[0]?.trim() ?? '')
  )
}

function tasksMentionedInTeams(context?: SearchContext): SearchIndexItem[] {
  const messages = teamsData as TeamsMessage[]
  const mentionedTaskIds = new Set(
    messages.filter((m) => m.isMention && m.linkedTaskId).map((m) => m.linkedTaskId!)
  )
  const index = buildSearchIndex(context?.tasks)
  return index.filter((item) => {
    if (item.source !== 'Tasks') return false
    const taskId = item.title.split(':')[0]?.trim()
    return taskId && mentionedTaskIds.has(taskId)
  })
}

export interface UniversalSearchContext extends SearchContext {
  activities?: Activity[]
}

type AIHandler = (query: string, context?: UniversalSearchContext) => UniversalSearchResponse | null

const AI_HANDLERS: { match: (q: string) => boolean; handle: AIHandler }[] = [
  {
    match: (q) => q.includes('due tomorrow') || (q.includes('tomorrow') && q.includes('task')),
    handle: (query, context) => ({
      query,
      isAIQuery: false,
      results: tasksDueTomorrow(context),
    }),
  },
  {
    match: (q) => q.includes('mention') && q.includes('teams'),
    handle: (query, context) => ({
      query,
      isAIQuery: false,
      results: tasksMentionedInTeams(context),
    }),
  },
  {
    match: (q) => q.includes('jira') && (q.includes('show') || q.includes('task') || q.includes('ticket')),
    handle: (query, context) => ({
      query,
      isAIQuery: false,
      results: getItemsBySource('Jira', context?.tasks),
    }),
  },
  {
    match: (q) =>
      q.includes('focus') ||
      q.includes('should i do') ||
      q.includes('what should') ||
      q.includes('priority today'),
    handle: (_query, context) => {
      const tasks = context?.tasks ?? (tasksData as Task[])
      const rec = getRecommendedTask(
        tasks,
        teamsData as TeamsMessage[],
        calendarData as CalendarEvent[]
      )
      const results = rec
        ? buildSearchIndex(tasks).filter((i) => i.source === 'Tasks' && i.title.startsWith(rec.task.id))
        : []
      return {
        query: '',
        isAIQuery: true,
        aiResponse: {
          answer: rec
            ? `Your highest priority task is ${rec.task.id}. It is due ${daysUntilDeadline(rec.task.deadline) === 1 ? 'tomorrow' : 'soon'}, has high client impact and is connected to today's client meeting.`
            : 'You have no pending tasks right now.',
        },
        results,
      }
    },
  },
  {
    match: (q) => q.includes('deadline') || (q.includes('due') && !q.includes('tomorrow')),
    handle: (query, context) => {
      const deadlines = deadlinesData as Deadline[]
      return {
        query,
        isAIQuery: true,
        aiResponse: {
          answer: 'Here are your upcoming deadlines:',
          listItems: deadlines.map(
            (d) => `${d.date}: ${d.title} (${d.priority} priority) — ${d.source}`
          ),
        },
        results: keywordSearch('deadline task', 5, context),
      }
    },
  },
  {
    match: (q) => q.includes('changed') || q.includes("what's new") || q.includes('updates today'),
    handle: (query, context) => {
      const activities = context?.activities ?? (activitiesData as Activity[])
      const activityResults = activities.map((a) => ({
        id: `activity-${a.id}`,
        source: 'Tasks' as SearchSource,
        title: a.title,
        description: a.description,
        date: a.timestamp,
        dateLabel: 'Today',
        route: '/reports',
        searchText: a.description,
      }))
      return {
        query,
        isAIQuery: true,
        aiResponse: {
          answer: "Here's what changed today across your work sources:",
          listItems: activities.map((a) => `${a.source}: ${a.title}`),
        },
        results: activityResults,
      }
    },
  },
  {
    match: (q) => q.includes('overload') || q.includes('available') || q.includes('workload'),
    handle: (query, context) => {
      const tasks = context?.tasks ?? (tasksData as Task[])
      const workload = calculateWorkload(tasks)
      const recCount = workload.isOverloaded
        ? getDeferRecommendations(tasks, workload.deficitMinutes).suggestions.length
        : 0
      return {
        query,
        isAIQuery: true,
        aiResponse: {
          answer: workload.isOverloaded
            ? `You currently have ${workload.plannedHoursLabel} of planned work but only ${workload.availableHoursLabel} available today. I recommend moving ${recCount} low-priority task${recCount !== 1 ? 's' : ''} to tomorrow.`
            : `Your workload is balanced today with ${workload.plannedHoursLabel} planned and ${workload.availableHoursLabel} available for focused work.`,
        },
        results: keywordSearch('low priority', 3, context),
      }
    },
  },
  {
    match: (q) => q.includes('email'),
    handle: (query, context) => ({
      query,
      isAIQuery: true,
      aiResponse: {
        answer:
          'You have 7 emails, 3 need action. The most urgent is from the client about a payment failure.',
      },
      results: getItemsBySource('Emails', context?.tasks).slice(0, 5),
    }),
  },
  {
    match: (q) => q.includes('meeting') || q.includes('calendar'),
    handle: (query, context) => ({
      query,
      isAIQuery: true,
      aiResponse: {
        answer:
          'You have 3 meetings today: Client Sync at 10:30 AM (Teams), Tech Discussion at 1:00 PM (Room 3), and 1:1 with Manager at 3:00 PM (Teams).',
      },
      results: getItemsBySource('Calendar', context?.tasks),
    }),
  },
]

export function runUniversalSearch(query: string, context?: UniversalSearchContext): UniversalSearchResponse {
  const q = normalize(query)

  if (!q) {
    return { query, isAIQuery: false, results: [] }
  }

  for (const handler of AI_HANDLERS) {
    if (handler.match(q)) {
      const response = handler.handle(query, context)
      if (response) {
        return { ...response, query }
      }
    }
  }

  // Source-filter shortcuts
  const sourceMap: Record<string, SearchSource> = {
    task: 'Tasks',
    tasks: 'Tasks',
    email: 'Emails',
    emails: 'Emails',
    teams: 'Teams',
    jira: 'Jira',
    calendar: 'Calendar',
    document: 'Documents',
    documents: 'Documents',
    excel: 'Excel',
  }

  for (const [key, source] of Object.entries(sourceMap)) {
    if (q === key || q === `show ${key}` || q.startsWith(`${key} `)) {
      const filtered = getItemsBySource(source, context?.tasks)
      const extra = keywordSearch(q, 8, context).filter((r) => r.source === source)
      return {
        query,
        isAIQuery: false,
        results: extra.length > 0 ? extra : filtered.slice(0, 8),
      }
    }
  }

  const results = keywordSearch(query, 8, context)
  return {
    query,
    isAIQuery: false,
    results,
    ...(results.length === 0
      ? {
          aiResponse: {
            answer:
              'No matching items found. Try asking "What should I focus on today?" or "Show Jira tasks".',
          },
          isAIQuery: true,
        }
      : {}),
  }
}

export function getSearchSuggestions(): string[] {
  return EXAMPLE_QUERIES
}
