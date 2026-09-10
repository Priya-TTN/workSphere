import { useState, useMemo } from 'react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import { formatRelativeTimeLive } from '@/lib/utils'
import { Mail, ChevronDown, Video, Sparkles, Calendar, ExternalLink } from 'lucide-react'
import { GmailConnector } from '@/components/email/GmailConnector'
import { useGmail } from '@/context/GmailContext'
import { extractMailInsight, extractAllMailInsights } from '@/services/email/emailExtractor'
import { emailBodyParagraphs, formatEmailPreview } from '@/services/email/formatEmailBody'
import type { EmailRecord } from '@/services/email/types'

function GmailRow({ email }: { email: EmailRecord }) {
  const [open, setOpen] = useState(false)
  const insight = useMemo(() => extractMailInsight(email), [email])
  const paragraphs = emailBodyParagraphs(email.bodyText)

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        insight.priority === 'HIGH' ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'
      }`}
    >
      <button className="w-full text-left" onClick={() => setOpen((value) => !value)}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">{email.from}</p>
              {email.isUnread && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Unread
                </span>
              )}
              {insight.actionItems.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  {insight.actionItems.length} Action Item{insight.actionItems.length > 1 ? 's' : ''}
                </span>
              )}
              {insight.meetingRequests.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Calendar className="h-3 w-3 text-amber-600" />
                  Meeting Signal
                </span>
              )}
              <PriorityBadge priority={insight.priority} showLabel={false} />
            </div>
            <p className="text-sm font-medium text-slate-800 mt-1">{email.subject}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {formatEmailPreview(email.bodyText || email.preview, 180)}
            </p>

            {/* Extracted Highlights Badge Bar */}
            {insight.actionItems.length > 0 && (
              <div className="mt-2.5 rounded-lg bg-purple-50/70 border border-purple-100 p-2 text-xs text-purple-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-[11px] text-purple-800">
                  <Sparkles className="h-3 w-3 text-purple-600" /> Extracted Action Item:
                </p>
                <p className="text-purple-950 font-medium pl-4">{insight.actionItems[0]}</p>
              </div>
            )}

            {insight.keyLinks.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {insight.keyLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded"
                  >
                    <Video className="h-3 w-3" />
                    {link.includes('meet.google') ? 'Google Meet Link' : link.includes('zoom') ? 'Zoom Link' : 'Meeting Link'}
                    <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-70" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] text-slate-400">{formatRelativeTimeLive(email.receivedAt)}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {insight.actionItems.length > 1 && (
            <div className="rounded-lg bg-purple-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-purple-900">All Identified Action Items:</p>
              <ul className="text-xs text-purple-950 space-y-1 list-disc list-inside">
                {insight.actionItems.map((act) => (
                  <li key={act}>{act}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 max-h-72 overflow-y-auto space-y-2">
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
        </div>
      )}
    </div>
  )
}

export function EmailsPage() {
  const { isConnected, messages, unseenCount, mailboxTotal } = useGmail()
  const [filter, setFilter] = useState<'all' | 'action' | 'meetings' | 'unread'>('all')

  const insights = useMemo(() => extractAllMailInsights(messages), [messages])
  const totalActionItems = useMemo(
    () => insights.reduce((acc, curr) => acc + curr.actionItems.length, 0),
    [insights]
  )
  const totalMeetingRequests = useMemo(
    () => insights.reduce((acc, curr) => acc + curr.meetingRequests.length, 0),
    [insights]
  )

  const filteredMessages = useMemo(() => {
    if (filter === 'unread') return messages.filter((m) => m.isUnread)
    if (filter === 'action') {
      return messages.filter((m) => extractMailInsight(m).actionItems.length > 0 || m.isUnread)
    }
    if (filter === 'meetings') {
      return messages.filter((m) => extractMailInsight(m).meetingRequests.length > 0 || m.meetingHints.length > 0)
    }
    return messages
  }, [filter, messages])

  if (isConnected) {
    return (
      <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Emails</h2>
            <p className="text-slate-500 mt-1">
              {messages.length} loaded of {mailboxTotal} · {unseenCount} unread · {totalActionItems} action items identified
            </p>
          </div>
        </div>

        <GmailConnector />

        {/* AI Extracted Insights Banner */}
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-white to-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">AI Mail Insights & Extracted Signals</h3>
            <AIBadge label="Real-Time Analysis" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">Extracted Action Items</p>
              <p className="text-lg font-bold text-purple-700 mt-0.5">{totalActionItems}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tasks & deliverables</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white p-3 shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">Meeting Invites / Signals</p>
              <p className="text-lg font-bold text-amber-700 mt-0.5">{totalMeetingRequests}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Syncs & calls detected</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">Unread Messages</p>
              <p className="text-lg font-bold text-blue-700 mt-0.5">{unseenCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting review</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Emails ({messages.length})
          </button>
          <button
            onClick={() => setFilter('action')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
              filter === 'action' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Needs Action ({totalActionItems})
          </button>
          <button
            onClick={() => setFilter('meetings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
              filter === 'meetings' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Calendar className="h-3 w-3" />
            Meeting Invites ({totalMeetingRequests})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
              filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Unread ({unseenCount})
          </button>
        </div>

        {/* Email Cards List */}
        <div className="space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((email) => <GmailRow key={email.id} email={email} />)
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 text-xs">
              No emails match the selected filter.
            </div>
          )}
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
