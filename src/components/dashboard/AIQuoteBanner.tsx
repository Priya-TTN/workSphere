import { Sparkles } from 'lucide-react'

export function AIQuoteBanner() {
  return (
    <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-white px-5 py-4 lg:px-6 lg:py-[18px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_1px_2px_rgba(124,58,237,0.04),0_4px_14px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100/80 border border-purple-200/50">
          <Sparkles className="h-[17px] w-[17px] text-purple-600" />
        </div>
        <p className="text-[13px] font-medium text-slate-700 italic leading-relaxed">
          &quot;A more organized day leads to a more empowered you.&quot;
        </p>
      </div>
      <span className="text-[11px] font-semibold text-purple-600 shrink-0 sm:pl-4">
        — WorkPilot AI
      </span>
    </div>
  )
}
