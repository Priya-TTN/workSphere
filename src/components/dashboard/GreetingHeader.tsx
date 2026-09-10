import { Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function GreetingHeader() {
  const { userName } = useAuth()
  const firstName = userName.trim().split(/\s+/)[0] || 'there'

  const today = new Date('2025-06-10')
  const formatted = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 lg:mb-6">
      <div className="min-w-0">
        <h2 className="text-xl lg:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
          Good Morning, {firstName}!
        </h2>
        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
          Here&apos;s your workday at a glance. Stay focused, you&apos;ve got this!
        </p>
      </div>
      <div className="flex items-center gap-2.5 sm:text-right shrink-0">
        <div>
          <p className="text-[13px] font-medium text-slate-700 leading-tight">{formatted}</p>
          <p className="text-[11px] text-slate-400 italic mt-0.5">&quot;Small steps, big progress.&quot;</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
          <Sun className="h-[17px] w-[17px] text-amber-500" />
        </div>
      </div>
    </div>
  )
}
