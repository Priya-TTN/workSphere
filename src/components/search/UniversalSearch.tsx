import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  Mail,
  Users,
  LayoutGrid,
  Calendar,
  FileText,
  Table2,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { runUniversalSearch, getSearchSuggestions } from '@/services/universalSearch'
import { useApp } from '@/context/AppContext'
import type { SearchIndexItem, SearchSource, UniversalSearchResponse } from '@/types/search'
import type { Priority } from '@/types'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { cn } from '@/lib/utils'

const sourceIcons: Record<SearchSource, typeof Mail> = {
  Tasks: CheckSquare,
  Emails: Mail,
  Teams: Users,
  Jira: LayoutGrid,
  Calendar: Calendar,
  Documents: FileText,
  Excel: Table2,
}

const sourceColors: Record<SearchSource, string> = {
  Tasks: 'bg-slate-50 text-slate-600',
  Emails: 'bg-blue-50 text-blue-500',
  Teams: 'bg-purple-50 text-purple-500',
  Jira: 'bg-blue-50 text-blue-600',
  Calendar: 'bg-green-50 text-green-600',
  Documents: 'bg-amber-50 text-amber-500',
  Excel: 'bg-green-50 text-green-700',
}

interface UniversalSearchProps {
  className?: string
}

export function UniversalSearch({ className }: UniversalSearchProps) {
  const { tasks, activities } = useApp()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<UniversalSearchResponse | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const suggestions = getSearchSuggestions()

  const executeSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResponse(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      setResponse(runUniversalSearch(trimmed, { tasks, activities }))
      setLoading(false)
    }, 180)
    return () => clearTimeout(timer)
  }, [tasks, activities])

  useEffect(() => {
    const cleanup = executeSearch(query)
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [query, executeSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (item: SearchIndexItem) => {
    setOpen(false)
    setQuery('')
    setResponse(null)
    navigate(item.route)
  }

  const handleSuggestion = (s: string) => {
    setQuery(s)
    setOpen(true)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setOpen(true)
      executeSearch(query)
    }
  }

  const showPanel = open && (query.trim().length > 0 || loading)
  const hasAI = response?.aiResponse
  const hasResults = (response?.results.length ?? 0) > 0

  return (
    <div ref={containerRef} className={cn('relative flex-1 max-w-3xl', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Ask WorkPilot anything... (e.g., What should I focus on today?)"
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100/80 transition-all"
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-haspopup="listbox"
          />
        </div>
      </form>

      {open && !query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Try asking
            </p>
          </div>
          <div className="p-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPanel && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.12)] overflow-hidden max-h-[min(440px,70vh)] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              <span className="text-[13px]">Searching...</span>
            </div>
          ) : (
            <div className="overflow-y-auto scrollbar-thin">
              {hasAI && (
                <div className="border-b border-purple-100 bg-gradient-to-br from-purple-50/80 to-white px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm" aria-hidden="true">✨</span>
                    <span className="text-[12px] font-semibold text-purple-700">WorkPilot AI</span>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed">
                    {response!.aiResponse!.answer}
                  </p>
                  {response!.aiResponse!.listItems && (
                    <ul className="mt-2.5 space-y-1">
                      {response!.aiResponse!.listItems.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-slate-600">
                          <span className="text-purple-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {hasResults && (
                <div className="p-2">
                  {!hasAI && (
                    <p className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Results
                    </p>
                  )}
                  {hasAI && (
                    <p className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Related items
                    </p>
                  )}
                  <ul role="listbox">
                    {response!.results.map((item) => {
                      const Icon = sourceIcons[item.source]
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleSelect(item)}
                            className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 transition-colors group"
                            role="option"
                          >
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5',
                                sourceColors[item.source]
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[13px] font-medium text-slate-800 leading-snug group-hover:text-purple-700 transition-colors line-clamp-1">
                                  {item.title}
                                </p>
                                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums pt-0.5">
                                  {item.dateLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.source}
                                </span>
                                {item.priority && (
                                  <PriorityBadge
                                    priority={item.priority as Priority}
                                    showLabel={false}
                                  />
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {!hasAI && !hasResults && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px] text-slate-500">No results found for &quot;{query}&quot;</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try one of the suggested queries above</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate(`/search?q=${encodeURIComponent(query.trim())}`)
              }}
              className="text-[11px] font-medium text-purple-600 hover:text-purple-700"
            >
              View full search results →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
