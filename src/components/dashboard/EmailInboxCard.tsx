import { useNavigate } from 'react-router-dom'
import { Mail, Loader2, AlertCircle } from 'lucide-react'
import emailsData from '@/data/emails.json'
import type { Email } from '@/types'
import { useGmail } from '@/context/GmailContext'
import { formatRelativeTimeLive } from '@/lib/utils'
import { formatEmailPreview } from '@/services/email/formatEmailBody'
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
          <h3 className={dashboardCardTitle}>Inbox glance</h3>
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
            {unseenCount > 0 && (
              <p className="text-[11px] text-blue-600 font-medium">{unseenCount} unread</p>
            )}
            {glance.map((email) => (
              <button
                key={email.id}
                onClick={() => navigate('/emails')}
                className="w-full text-left"
              >
                <p className="text-[13px] font-medium text-slate-800 leading-snug truncate">
                  {email.isUnread ? (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 align-middle" />
                  ) : null}
                  {email.subject}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {email.from} · {formatRelativeTimeLive(email.receivedAt)}
                </p>
                {email.preview && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {formatEmailPreview(email.bodyText || email.preview, 90)}
                  </p>
                )}
              </button>
            ))}
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
