import emailsData from '@/data/emails.json'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { formatRelativeTime } from '@/lib/utils'
import type { Email, Priority } from '@/types'
import { Mail, AlertCircle } from 'lucide-react'

export function EmailsPage() {
  const emails = emailsData as Email[]
  const needsAction = emails.filter((e) => e.needsAction)

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Emails</h2>
        <p className="text-slate-500 mt-1">
          {emails.length} emails · {needsAction.length} need action
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors hover:shadow-md ${
              email.needsAction ? 'border-blue-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <Mail className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{email.from}</p>
                  {email.needsAction && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      Needs Action
                    </span>
                  )}
                  <PriorityBadge priority={email.priority as Priority} showLabel={false} />
                </div>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{email.subject}</p>
                <p className="text-xs text-slate-400 mt-1 truncate">{email.preview}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {formatRelativeTime(email.receivedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
