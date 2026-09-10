import { useNavigate } from 'react-router-dom'
import { Mail, Loader2, AlertCircle, Sparkles, Video } from 'lucide-react'
import emailsData from '@/data/emails.json'
import type { Email } from '@/types'
import { useGmail } from '@/context/GmailContext'
import { formatRelativeTimeLive } from '@/lib/utils'
import { formatEmailPreview } from '@/services/email/formatEmailBody'
import { extractMailInsight } from '@/services/email/emailExtractor'
import {
  dashboardCard,
  dashboardCardPadding,
  dashboardCardHeader,
  dashboardCardTitle,
  dashboardLink,
} from './styles'

const mockEmails = emailsData as Email[]

export function EmailInboxCard() {
  const navigate = useNavigate()
  const { isConnected, isFetching, messages, unseenCount } = useGmail()

  if (isConnected) {
    const glance = messages.slice(0, 5)
    return (
      <div className={`${dashboardCard} ${dashboardCardPadding}`}>
        <div className={dashboardCardHeader}>
          <div className="flex items-center gap-2">
            <h3 className={dashboardCardTitle}>Inbox glance</h3>
            {unseenCount > 0 && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {unseenCount} unread
              </span>
            )}
          </div>
          <button onClick={() => navigate('/emails')} className={dashboardLink}>
            View All →
          </button>
        </div>

        {isFetching && glance.length === 0 ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-xs text-slate-400">Loading mail…</span>
          </div>
        ) : glance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Mail className="h-7 w-7 text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">Inbox is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {glance.map((email) => {
              const insight = extractMailInsight(email)
              return (
                <button
                  key={email.id}
                  onClick={() => navigate('/emails')}
                  className="w-full text-left rounded-lg p-1.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug truncate">
                      {email.isUnread ? (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 align-middle" />
                      ) : null}
                      {email.subject}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTimeLive(email.receivedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{email.from}</p>

                  {insight.actionItems.length > 0 ? (
                    <p className="text-[11px] font-medium text-purple-600 truncate mt-1 flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      {insight.actionItems[0]}
                    </p>
                  ) : (
                    email.preview && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {formatEmailPreview(email.bodyText || email.preview, 80)}
                      </p>
                    )
                  )}

                  {insight.keyLinks.length > 0 && (
                    <p className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1 font-medium">
                      <Video className="h-3 w-3" />
                      Video link included
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding}`}>
      <div className={dashboardCardHeader}>
        <h3 className={dashboardCardTitle}>Inbox glance</h3>
        <button onClick={() => navigate('/emails')} className={dashboardLink}>
          View All →
        </button>
      </div>
      <div className="space-y-3">
        {mockEmails.slice(0, 4).map((email) => (
          <div key={email.id}>
            <p className="text-[13px] font-medium text-slate-800 leading-snug truncate">{email.subject}</p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{email.from}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/emails')}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-200 py-2 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors inline-flex items-center justify-center gap-1"
      >
        <AlertCircle className="h-3 w-3" />
        Connect Gmail for real mail →
      </button>
    </div>
  )
}
