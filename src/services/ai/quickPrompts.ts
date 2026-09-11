export const QUICK_PROMPTS = [
  "📄 Generate today's work PDF report",
  "📅 List today's tasks, meetings & mails",
  "📩 High priority email action items list",
  "🚀 Generate daily team standup report",
  "⚡ What should I focus on right now?",
  "📌 Convert email action items to tasks",
  "📝 Draft email reply for unread items",
  "📊 Check workload balance & focus blocks",
  "💬 Summarize recent Teams mentions",
  "📊 View active Jira ticket breakdown",
  "🧹 Clear completed tasks",
]

export const COMPACT_QUICK_PROMPTS = [
  "📄 Download workday PDF report",
  "📅 List tasks, meetings & mails",
  "📩 Email action items list",
  "⚡ Focus right now",
]

export interface PromptCategory {
  title: string
  prompts: string[]
}

export const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    title: '📄 Reports & PDF',
    prompts: [
      "📄 Generate today's work PDF report",
      "📅 List today's tasks, meetings & mails",
      "🚀 Generate daily team standup report",
    ],
  },
  {
    title: '📩 Email & Tasks',
    prompts: [
      "📩 High priority email action items list",
      "📌 Convert email action items to tasks",
      "📝 Draft email reply for unread items",
    ],
  },
  {
    title: '⚡ Focus & Workload',
    prompts: [
      "⚡ What should I focus on right now?",
      "📊 Check workload balance & focus blocks",
      "💬 Summarize recent Teams mentions",
      "📊 View active Jira ticket breakdown",
    ],
  },
]
