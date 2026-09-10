import { Link } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { WorkPilotChatPanel } from '@/components/chat/WorkPilotChatPanel'
import { useWorkPilotChat } from '@/context/WorkPilotChatContext'

export function AskWorkPilotPage() {
  const { isConfigured } = useWorkPilotChat()

  return (
    <div className="p-4 lg:p-6 max-w-[800px] mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="WorkPilot AI" className="h-7 w-7 rounded-lg shrink-0 object-contain" />
            <h2 className="text-2xl font-bold text-slate-900">Ask WorkPilot</h2>
          </div>
          <Link
            to="/ai-settings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            <Brain className="h-3.5 w-3.5" />
            {isConfigured ? 'LLM connected' : 'Connect LLM'}
          </Link>
        </div>
        <p className="text-slate-500 mt-1">
          Central AI assistant over your mail, calendar, tasks, and tickets.
        </p>
      </div>

      <WorkPilotChatPanel />
    </div>
  )
}
