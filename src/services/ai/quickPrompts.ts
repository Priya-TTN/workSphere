export const QUICK_PROMPTS = [
  "⚡ What should I work on first today?",
  "📅 Plan my day around my meetings.",
  "📩 Which emails need my attention?",
  "📄 Generate today's work PDF report",
  "📋 List today's tasks, meetings & mails",
  "🚀 Generate daily team standup report",
  "📌 Convert email action items to tasks",
  "📝 Draft email reply for unread items",
  "📊 Check workload balance & focus blocks",
  "💬 Summarize recent Teams mentions",
  "📊 View active Jira ticket breakdown",
  "🧹 Clear completed tasks",
]

export const COMPACT_QUICK_PROMPTS = [
  "⚡ What to work on first today?",
  "📅 Plan my day around meetings",
  "📩 Emails needing attention",
  "📄 Download workday PDF report",
]

export interface PromptCategory {
  title: string
  prompts: string[]
}

export const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    title: '⚡ Core Work Actions',
    prompts: [
      "⚡ What should I work on first today?",
      "📅 Plan my day around my meetings.",
      "📩 Which emails need my attention?",
    ],
  },
  {
    title: '📄 Reports & PDF',
    prompts: [
      "📄 Generate today's work PDF report",
      "📋 List today's tasks, meetings & mails",
      "🚀 Generate daily team standup report",
    ],
  },
  {
    title: '📩 Email & Tasks',
    prompts: [
      "📌 Convert email action items to tasks",
      "📝 Draft email reply for unread items",
      "💬 Summarize recent Teams mentions",
      "📊 View active Jira ticket breakdown",
    ],
  },
]
