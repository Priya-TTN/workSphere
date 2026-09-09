import jiraData from '@/data/jira.json'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { formatRelativeTime } from '@/lib/utils'
import type { JiraTicket, Priority } from '@/types'
import { LayoutGrid } from 'lucide-react'

export function JiraPage() {
  const tickets = jiraData as JiraTicket[]

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Jira</h2>
        <p className="text-slate-500 mt-1">
          {tickets.length} tickets assigned · {tickets.filter((t) => t.priority === 'HIGH').length} high priority
        </p>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <LayoutGrid className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-blue-600">{ticket.key}</span>
                  <PriorityBadge priority={ticket.priority as Priority} showLabel={false} />
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{ticket.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">Assignee: {ticket.assignee}</span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(ticket.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
