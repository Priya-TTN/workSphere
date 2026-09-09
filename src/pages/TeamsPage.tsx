import teamsData from '@/data/teams.json'
import { formatRelativeTime } from '@/lib/utils'
import type { TeamsMessage } from '@/types'
import { Users, AtSign } from 'lucide-react'

export function TeamsPage() {
  const messages = teamsData as TeamsMessage[]

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Microsoft Teams</h2>
        <p className="text-slate-500 mt-1">
          {messages.length} recent messages · {messages.filter((m) => m.isMention).length} mentions for you
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border bg-white p-4 shadow-sm ${
              msg.isMention ? 'border-purple-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{msg.author}</span>
                  <span className="text-xs text-slate-400">in #{msg.channel}</span>
                  {msg.isMention && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      <AtSign className="h-3 w-3" />
                      Mention
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{msg.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {formatRelativeTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
