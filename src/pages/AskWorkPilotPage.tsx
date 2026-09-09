import { useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { getAIResponse } from '@/services/aiSearch'
import { AIBadge } from '@/components/ui/AIBadge'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import deadlinesData from '@/data/deadlines.json'
import type { Deadline } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'list' | 'activity'
  items?: string[]
}

export function AskWorkPilotPage() {
  const { activities, tasks } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello Harsh! I\'m WorkPilot AI. I can help you prioritize tasks, check deadlines, review your workload, or see what changed today. What would you like to know?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const result = getAIResponse(userMsg, deadlinesData as Deadline[], activities, tasks)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.answer,
        type: result.type,
        items:
          result.type === 'list'
            ? result.items
            : result.type === 'activity'
              ? result.activities?.map((a) => `${a.source}: ${a.title}`)
              : undefined,
      },
    ])
    setLoading(false)
  }

  const handleSend = () => sendMessage(input.trim())

  const quickPrompts = [
    'What should I focus on today?',
    'Am I overloaded?',
    'What deadlines are coming up?',
    'What changed today?',
  ]

  return (
    <div className="p-4 lg:p-6 max-w-[800px] mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">Ask WorkPilot</h2>
        </div>
        <p className="text-slate-500 mt-1">Your AI workday assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="mb-1.5">
                  <AIBadge label="AI Response" />
                </div>
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.items && (
                <ul className="mt-2 space-y-1">
                  {msg.items.map((item, index) => (
                    <li key={`${item}-${index}`} className="text-sm">• {item}</li>
                  ))}
                </ul>
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

      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-purple-200 hover:bg-purple-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your workday..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="h-12 w-12 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
