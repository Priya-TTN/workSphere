import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  CheckSquare,
  Mail,
  Users,
  LayoutGrid,
  Calendar,
  FileText,
  Table2,
  Sparkles,
  BarChart3,
  Settings,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/dashboard?view=workday', label: 'My Workday', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/emails', label: 'Emails', icon: Mail, badge: 7 },
  { to: '/teams', label: 'Teams', icon: Users, badge: 4 },
  { to: '/jira', label: 'Jira', icon: LayoutGrid, badge: 5 },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/documents', label: 'Files & Documents', icon: FileText },
  { to: '/excel', label: 'Excel Insights', icon: Table2 },
  { to: '/ask-workpilot', label: 'Ask WorkPilot', icon: Sparkles },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  const isActive = (to: string) => {
    const [path, search] = to.split('?')
    if (search) {
      return location.pathname === path && location.search.includes(search)
    }
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search.includes('view=workday')
    }
    return location.pathname === path
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-navy-900 text-white transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold tracking-tight text-white truncate">WorkPilot AI</h1>
              <p className="text-[10px] text-slate-400 leading-tight truncate">Your Day. Simplified. Smarter.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 hover:bg-navy-700 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.to)
              return (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                      active
                        ? 'bg-purple-600/15 text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5 before:rounded-r before:bg-purple-500'
                        : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                    )}
                  >
                    <item.icon className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={active ? 2.25 : 2} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="px-3 py-3 border-t border-navy-700/80">
          <div className="rounded-lg bg-navy-800/80 px-3 py-2.5">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Powered by AI to simplify your workday
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
