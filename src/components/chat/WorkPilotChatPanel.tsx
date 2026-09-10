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
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.items && (
                <ul className="mt-2 space-y-1">
                  {msg.items.map((item, index) => (
                    <li key={`${item}-${index}`} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              )}
              {msg.actionType === 'pdf' && (
                <button
                  type="button"
                  onClick={generatePdfReport}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Print / Download Workday PDF Report
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            WorkPilot is thinking...
          </div>
        )}
      </div>

      <div className={cn('shrink-0', compact ? 'border-t border-slate-100 px-3 pb-3 pt-2' : '')}>
        <div className={cn('flex flex-wrap gap-2', compact ? 'mb-2' : 'mb-3')}>
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-purple-200 hover:bg-purple-50"
            >
              {prompt}
            </button>
          ))}
          {!compact && (
            <button
              type="button"
              onClick={() => setShowAllPrompts((value) => !value)}
              className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-purple-200"
            >
              {showAllPrompts ? 'Show less' : 'More questions'}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={compact ? 'Ask about your workday...' : 'Ask anything about your workday...'}
            className={cn(
              'flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100',
              compact ? 'py-2.5' : 'py-3'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className={cn('rounded-xl', compact ? 'h-10 w-10' : 'h-12 w-12')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
