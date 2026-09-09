import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Loader2, Mail, Users, LayoutGrid, Calendar, FileText, Table2, CheckSquare } from 'lucide-react'
import { runUniversalSearch, getSearchSuggestions } from '@/services/universalSearch'
import { useApp } from '@/context/AppContext'
import type { SearchIndexItem, SearchSource } from '@/types/search'
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

export function SearchPage() {
  const { tasks, activities } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ReturnType<typeof runUniversalSearch> | null>(null)
  const navigate = useNavigate()
  const suggestions = getSearchSuggestions()

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setResponse(null)
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setResponse(runUniversalSearch(q, { tasks, activities }))
    setLoading(false)
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      runSearch(q)
    }
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: query })
    runSearch(query)
  }

  const handleResultClick = (item: SearchIndexItem) => {
    navigate(item.route)
  }

  return (
    <div className="p-4 lg:p-6 max-w-[800px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Search</h2>
        <p className="text-slate-500 mt-1">Ask WorkPilot anything about your workday</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask WorkPilot anything..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mb-8">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuery(s)
              setSearchParams({ q: s })
              runSearch(s)
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">WorkPilot is thinking...</span>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-4">
          {response.aiResponse && (
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-base" aria-hidden="true">✨</span>
                <span className="text-sm font-semibold text-purple-700">WorkPilot AI</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{response.aiResponse.answer}</p>
              {response.aiResponse.listItems && (
                <ul className="mt-4 space-y-2">
                  {response.aiResponse.listItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-purple-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {response.results.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {response.results.length} result{response.results.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ul>
                {response.results.map((item) => {
                  const Icon = sourceIcons[item.source]
                  return (
                    <li key={item.id} className="border-b border-slate-50 last:border-0">
                      <button
                        onClick={() => handleResultClick(item)}
                        className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            sourceColors[item.source]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800">{item.title}</p>
                            <span className="text-[11px] text-slate-400 shrink-0">{item.dateLabel}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {item.source}
                            </span>
                            {item.priority && (
                              <PriorityBadge priority={item.priority as Priority} showLabel={false} />
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
        </div>
      )}
    </div>
  )
}
