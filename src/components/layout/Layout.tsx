import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { WorkPilotDock } from '@/components/chat/WorkPilotDock'
import { WorkPilotChatProvider } from '@/context/WorkPilotChatContext'
import { cn } from '@/lib/utils'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const showDock = location.pathname !== '/ask-workpilot'

  return (
    <WorkPilotChatProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0 lg:pl-[240px]">
          <TopHeader onMenuClick={() => setSidebarOpen(true)} />
          <main
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden',
              showDock && 'pb-24'
            )}
          >
            <Outlet />
          </main>
        </div>
        <WorkPilotDock />
      </div>
    </WorkPilotChatProvider>
  )
}
