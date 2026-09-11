import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, FileText } from 'lucide-react'
import { AIBadge } from '@/components/ui/AIBadge'
import { Button } from '@/components/ui/Button'
import { useWorkPilotChat } from '@/context/WorkPilotChatContext'
import { COMPACT_QUICK_PROMPTS, QUICK_PROMPTS } from '@/services/ai/quickPrompts'
import { cn } from '@/lib/utils'

interface WorkPilotChatPanelProps {
  compact?: boolean
}

export function WorkPilotChatPanel({ compact = false }: WorkPilotChatPanelProps) {
  const { messages, input, setInput, loading, isConfigured, sendMessage, generatePdfReport } = useWorkPilotChat()
  const [showAllPrompts, setShowAllPrompts] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const handleSend = () => void sendMessage(input)
  const prompts = compact
    ? COMPACT_QUICK_PROMPTS
    : showAllPrompts
      ? QUICK_PROMPTS
      : QUICK_PROMPTS.slice(0, 8)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className={cn('min-h-0 flex-1 overflow-y-auto space-y-3', compact ? 'px-3 py-3' : 'mb-4 space-y-4')}
      >
        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={cn(
                'rounded-xl px-3 py-2.5',
                compact ? 'max-w-[90%]' : 'max-w-[85%] px-4 py-3',
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-slate-200 shadow-sm'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="mb-1.5">
                  <AIBadge label={isConfigured ? 'External LLM' : 'Built-in AI'} />
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              {msg.items && msg.items.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
                  {msg.items.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-lg bg-slate-50/80 border border-slate-100 px-3 py-2 text-xs sm:text-sm text-slate-700 font-normal leading-snug"
                    >
                      <span className="shrink-0 text-slate-400 font-mono text-xs select-none">
                        {index + 1}.
                      </span>
                      <span className="flex-1 min-w-0">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {msg.actionType === 'pdf' && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">
                    Ready to export workday report
                  </span>
                  <button
                    type="button"
                    onClick={generatePdfReport}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 hover:shadow-lg transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    Download / Print PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            WorkPilot is thinking...
          </div>
        )}
      </div>

      <div className={cn('shrink-0', compact ? 'border-t border-slate-100 px-3 pb-3 pt-2' : '')}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Suggested Prompts
          </span>
          {!compact && (
            <button
              type="button"
              onClick={() => setShowAllPrompts((value) => !value)}
              className="text-[11px] font-medium text-purple-600 hover:text-purple-700"
            >
              {showAllPrompts ? 'Show less' : 'View all prompts'}
            </button>
          )}
        </div>
        <div className={cn('flex flex-wrap gap-1.5', compact ? 'mb-2' : 'mb-3')}>
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 active:scale-95 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={compact ? 'Ask about tasks, meetings, mails...' : 'Ask about your tasks, meetings, mails, Jira...'}
            className={cn(
              'flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 placeholder:text-slate-400',
              compact ? 'py-2.5' : 'py-3'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className={cn('rounded-xl shrink-0', compact ? 'h-10 w-10' : 'h-12 w-12')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
