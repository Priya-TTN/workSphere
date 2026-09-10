import { useState } from 'react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { formatRelativeTimeLive } from '@/lib/utils'
import type { Priority } from '@/types'
import { Mail, AlertCircle, ChevronDown, Video } from 'lucide-react'
import { GmailConnector } from '@/components/email/GmailConnector'
import { useGmail } from '@/context/GmailContext'
import { isLikelyActionNeeded } from '@/services/email/meetingHints'
import { emailBodyParagraphs, formatEmailPreview } from '@/services/email/formatEmailBody'
import type { EmailRecord } from '@/services/email/types'

function GmailRow({ email }: { email: EmailRecord }) {
  const [open, setOpen] = useState(false)
  const needsAction = isLikelyActionNeeded(email.subject, email.bodyText, email.isUnread)
  const priority: Priority = needsAction && email.isUnread ? 'HIGH' : needsAction ? 'MEDIUM' : 'LOW'
  const paragraphs = emailBodyParagraphs(email.bodyText)

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-colors hover:shadow-md ${
        needsAction ? 'border-blue-200' : 'border-slate-200'
      }`}
    >
      <button className="w-full text-left" onClick={() => setOpen((value) => !value)}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">{email.from}</p>
              {email.isUnread && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Unread
                </span>
              )}
              {needsAction && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <AlertCircle className="h-3 w-3" />
                  Needs Action
                </span>
              )}
              <PriorityBadge priority={priority} showLabel={false} />
            </div>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{email.subject}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {formatEmailPreview(email.bodyText || email.preview, 180)}
            </p>
            {email.meetingHints.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-600">
                <Video className="h-3 w-3" />
                {email.meetingHints[0].value}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] text-slate-400">{formatRelativeTimeLive(email.receivedAt)}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
      {open && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 max-h-72 overflow-y-auto space-y-2">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-400">No readable text was found in this message.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function EmailsPage() {
  const { isConnected, messages, unseenCount, mailboxTotal } = useGmail()

  if (isConnected) {
    const needsAction = messages.filter((email) =>
      isLikelyActionNeeded(email.subject, email.bodyText, email.isUnread)
    )
    return (
      <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Emails</h2>
          <p className="text-slate-500 mt-1">
            {messages.length} loaded of {mailboxTotal} · {unseenCount} unread · {needsAction.length} need action
          </p>
        </div>
        <GmailConnector />
        <div className="space-y-3">
          {messages.map((email) => (
            <GmailRow key={email.id} email={email} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Emails</h2>
        <p className="text-slate-500 mt-1">Connect your Gmail account to manage your inbox</p>
      </div>
      <GmailConnector />
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Mail className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
        <p className="text-sm font-medium text-slate-700">No emails connected</p>
        <p className="text-xs text-slate-500 mt-1">
          Use the Gmail Connector above to sync your inbox and action items in real time.
        </p>
      </div>
    </div>
  )
}
