import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Users, LayoutGrid, Calendar, Bell } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types'

const iconMap: Record<Notification['type'], typeof Mail> = {
  email: Mail,
  teams: Users,
  jira: LayoutGrid,
  calendar: Calendar,
  system: Bell,
}

const routeMap: Record<Notification['type'], string> = {
  email: '/emails',
  teams: '/teams',
  jira: '/jira',
  calendar: '/calendar',
  system: '/documents',
}

interface NotificationPanelProps {
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  onClose: () => void
}

export function NotificationPanel({
  notifications,
  setNotifications,
  onClose,
}: NotificationPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (notif: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )
    onClose()
    navigate(routeMap[notif.type])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs text-purple-600 font-medium hover:underline disabled:opacity-50"
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notif) => {
          const Icon = iconMap[notif.type]
          return (
            <div
              key={notif.id}
              className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                !notif.read ? 'bg-purple-50/30' : ''
              }`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{notif.title}</p>
                <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatRelativeTime(notif.timestamp)}
                </p>
              </div>
              {!notif.read && (
                <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
