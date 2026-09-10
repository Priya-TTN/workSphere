import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { NotificationPanel } from './NotificationPanel'
import { UniversalSearch } from '@/components/search/UniversalSearch'
import notificationsData from '@/data/notifications.json'
import type { Notification } from '@/types'

interface TopHeaderProps {
  onMenuClick: () => void
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(
    notificationsData as Notification[]
  )
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 sm:gap-6 lg:gap-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 shrink-0 min-w-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-1.5 hover:bg-slate-100 transition-colors -ml-1 shrink-0"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </button>

      <UniversalSearch className="min-w-0" />

      <div className="flex items-center gap-4 sm:gap-6 lg:gap-7 shrink-0 ml-2 sm:ml-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              notifications={notifications}
              setNotifications={setNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

        <UserMenu />
      </div>
    </header>
  )
}
