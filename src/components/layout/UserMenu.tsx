import { useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'

interface UserMenuProps {
  user?: { name: string; role: string; avatar: string }
}

export function UserMenu({ user: userProp }: UserMenuProps = {}) {
  const { logout, userName, userRole, userAvatar } = useAuth()
  const { resetAppState } = useApp()
  const navigate = useNavigate()

  const name = userProp?.name ?? userName
  const role = userProp?.role ?? userRole
  const avatar = userProp?.avatar ?? userAvatar

  const handleLogout = () => {
    resetAppState()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
            {avatar}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-800 leading-tight">{name}</p>
            <p className="text-[11px] text-slate-500">{role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
            onSelect={() => navigate('/settings')}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
            onSelect={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
            onSelect={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
