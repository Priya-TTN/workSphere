import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, FileText, Copy, Check, RotateCcw, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { AIBadge } from '@/components/ui/AIBadge'
import { Button } from '@/components/ui/Button'
import { useWorkPilotChat } from '@/context/WorkPilotChatContext'
import { COMPACT_QUICK_PROMPTS, QUICK_PROMPTS } from '@/services/ai/quickPrompts'
import { cn } from '@/lib/utils'

interface WorkPilotChatPanelProps {
  compact?: boolean
}

function formatBoldText(str: string) {
  const parts = str.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldVal = part.slice(2, -2)
      if (boldVal.includes('Priority: 96/100') || boldVal.toLowerCase().includes('critical')) {
        return (
          <span key={i} className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 text-xs">
            {boldVal}
          </span>
        )
      }
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {boldVal}
        </strong>
      )
    }
    return part
  })
}

function renderFormattedContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return <div key={idx} className="h-1.5" />
    }

    if (trimmed.startsWith('⚠️')) {
      return (
        <div key={idx} className="my-2 rounded-xl bg-amber-50/90 border border-amber-200/70 p-3 text-xs sm:text-sm text-amber-900 font-medium leading-relaxed shadow-2xs">
          {formatBoldText(trimmed)}
        </div>
      )
    }

    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const bulletContent = trimmed.replace(/^[•\-]\s*/, '')
      return (
        <div key={idx} className="flex items-start gap-2 py-0.5 text-xs sm:text-sm text-slate-700">
          <span className="text-purple-500 font-bold shrink-0 select-none">•</span>
          <span className="flex-1">{formatBoldText(bulletContent)}</span>
        </div>
      )
    }

    return (
      <div key={idx} className="text-xs sm:text-sm leading-relaxed text-slate-800">
        {formatBoldText(trimmed)}
      </div>
    )
  })
}

function renderSourceBadge(sourceStr: string) {
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
  const lower = sourceStr.toLowerCase()
  if (lower.includes('jira')) badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
  else if (lower.includes('gmail') || lower.includes('email')) badgeColor = 'bg-red-50 text-red-700 border-red-200'
  else if (lower.includes('calendar')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  else if (lower.includes('teams')) badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'

  return (
    <span key={sourceStr} className={cn('rounded-md px-2 py-0.5 font-medium text-[10px] border shadow-2xs', badgeColor)}>
      {sourceStr}
    </span>
  )
}

export function WorkPilotChatPanel({ compact = false }: WorkPilotChatPanelProps) {
  const {
    messages,
    input,
    setInput,
    loading,
    isConfigured,
    sendMessage,
    generatePdfReport,
    clearMessages,
    regenerateLastMessage,
    executeAction,
  } = useWorkPilotChat()

  const [showAllPrompts, setShowAllPrompts] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const handleSend = () => void sendMessage(input)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const prompts = compact
    ? COMPACT_QUICK_PROMPTS
    : showAllPrompts
      ? QUICK_PROMPTS
      : QUICK_PROMPTS.slice(0, 8)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">WorkPilot Assistant</span>
          {isConfigured ? (
            <span className="rounded bg-purple-50 border border-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
              External LLM
            </span>
          ) : (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
              Context-Aware Engine
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={regenerateLastMessage}
            disabled={loading || messages.length <= 1}
            className="inline-flex items-center gap-1 hover:text-purple-600 disabled:opacity-40 transition-colors"
            title="Regenerate last response"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={clearMessages}
            disabled={messages.length <= 1}
            className="inline-flex items-center gap-1 hover:text-red-600 disabled:opacity-40 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className={cn('min-h-0 flex-1 overflow-y-auto space-y-3', compact ? 'px-3 py-2' : 'mb-3 space-y-4')}
      >
        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={cn(
                'relative group rounded-2xl px-4 py-3 transition-all',
                compact ? 'max-w-[94%]' : 'max-w-[88%]',
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-xs shadow-md shadow-purple-600/10'
                  : 'bg-white border border-slate-200/90 shadow-sm text-slate-800 rounded-bl-xs'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <AIBadge label={isConfigured ? 'External LLM' : 'WorkPilot AI'} />
                    {msg.confidence && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                        <ShieldCheck className="h-3 w-3" /> Confidence: {msg.confidence}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    title="Copy response"
                  >
                    {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

              {/* Formatted Markdown Content */}
              <div className="space-y-1">
                {renderFormattedContent(msg.content)}
              </div>

              {/* Items List */}
              {msg.items && msg.items.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
                  {msg.items.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2 text-xs sm:text-sm text-slate-700 font-normal leading-snug"
                    >
                      <span className="shrink-0 text-purple-600 font-semibold text-xs select-none">
                        {index + 1}.
                      </span>
                      <span className="flex-1 min-w-0">{formatBoldText(item)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence & Reasons Breakdown Card */}
              {msg.reasons && msg.reasons.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50/50 border-l-3 border-amber-400 border-t border-r border-b border-amber-200/50 p-2.5 text-xs text-amber-900">
                  <span className="font-semibold text-amber-950 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> Reason & Priority Evidence:
                  </span>
                  <div className="space-y-1 pl-1">
                    {msg.reasons.map((r) => (
                      <div key={r} className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-amber-500 font-bold text-[10px]">✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Citations Badges */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pt-1">
                  <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Sources:</span>
                  {msg.sources.map(renderSourceBadge)}
                </div>
              )}

              {/* Interactive Contextual Action Buttons */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  {msg.suggestedActions.map((act, index) => {
                    const isPrimary = index === 0 && (act.label.includes('Start') || act.label.includes('Apply') || act.label.includes('Draft'))
                    return (
                      <button
                        key={act.label}
                        type="button"
                        onClick={() => {
                          if (act.action === 'pdf' || act.action === 'convert_email_tasks' || act.action === 'copy_text' || act.action === 'start_task') {
                            executeAction(act)
                          } else {
                            void sendMessage(act.label)
                          }
                        }}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5',
                          isPrimary
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20'
                            : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                        )}
                      >
                        {act.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {msg.actionType === 'pdf' && !msg.suggestedActions && (
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
            WorkPilot is reasoning across your work data...
          </div>
        )}
      </div>

      {/* Suggested Prompts Pill Section */}
      <div className={cn('shrink-0', compact ? 'border-t border-slate-100 px-3 pb-3 pt-2' : '')}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
            placeholder={compact ? 'Ask about tasks, meetings, mails...' : 'Ask anything: "What should I do now?", "Show ANZ-342", "Blockers"...'}
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
