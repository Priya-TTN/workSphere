import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Expand, X } from 'lucide-react'
import { WorkPilotChatPanel } from './WorkPilotChatPanel'
import { useWorkPilotChat } from '@/context/WorkPilotChatContext'

export function WorkPilotDock() {
  const location = useLocation()
  const { isConfigured } = useWorkPilotChat()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (location.pathname === '/ask-workpilot') return null

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
      {open && (
        <div className="pointer-events-auto flex h-[min(70vh,540px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <img src="/logo.svg" alt="WorkPilot AI" className="h-4 w-4 rounded shrink-0 object-contain" />
                Ask WorkPilot
              </p>
              <p className="text-[11px] text-slate-500">
                {isConfigured ? 'LLM connected' : 'Built-in assistant'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/ask-workpilot"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-purple-600"
                aria-label="Open full Ask WorkPilot page"
                title="Open full page"
              >
                <Expand className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <WorkPilotChatPanel compact />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
        aria-label={open ? 'Close Ask WorkPilot' : 'Open Ask WorkPilot'}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <img src="/logo.svg" alt="WorkPilot AI" className="h-7 w-7 rounded-md object-contain" />}
      </button>
    </div>
  )
}
