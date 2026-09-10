import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Loader2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { useLlm } from '@/context/LlmContext'
import { chatWithLlm } from '@/services/ai/llmClient'
import { validateLlmEndpoint } from '@/services/ai/llmSettings'

export function LlmSettingsPage() {
  const { settings, isConfigured, save, clear } = useLlm()
  const [endpoint, setEndpoint] = useState(settings.endpoint)
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [model, setModel] = useState(settings.model)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const invalid = validateLlmEndpoint(endpoint)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    save({ endpoint, apiKey, model })
    setSaved(true)
  }

  const handleTest = async () => {
    const invalid = validateLlmEndpoint(endpoint)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setTesting(true)
    setTestMessage(null)
    try {
      save({ endpoint, apiKey, model })
      const reply = await chatWithLlm(
          { endpoint: endpoint.trim(), apiKey: apiKey.trim(), model: model.trim() || 'gemini-2.0-flash' },
        [
          { role: 'system', content: 'You are WorkPilot. Reply in one short sentence.' },
          { role: 'user', content: 'Say hello and confirm you are connected to WorkPilot.' },
        ]
      )
      setTestMessage(reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the LLM.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-[720px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">AI Model</h2>
        </div>
        <p className="text-slate-500 mt-1">
          Connect OpenAI, Gemini, Groq, or Ollama so Ask WorkPilot can reason over your mail, calendar, and tasks.
        </p>
      </div>

      {isConfigured && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Chatbot is connected. Open{' '}
          <Link to="/ask-workpilot" className="font-medium underline">
            Ask WorkPilot
          </Link>{' '}
          to talk to it.
        </div>
      )}

      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="llm-endpoint" className="text-sm font-medium text-slate-700 mb-1.5 block">
            LLM API URL
          </label>
          <Input
            id="llm-endpoint"
            type="url"
            autoComplete="off"
            placeholder="https://generativelanguage.googleapis.com/v1beta"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="bg-white"
          />
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Gemini:{' '}
            <code className="bg-white px-1 rounded">https://generativelanguage.googleapis.com/v1beta</code>
            <br />
            OpenAI: <code className="bg-white px-1 rounded">https://api.openai.com/v1/chat/completions</code>
            <br />
            Groq:{' '}
            <code className="bg-white px-1 rounded">https://api.groq.com/openai/v1/chat/completions</code>
            <br />
            Ollama:{' '}
            <code className="bg-white px-1 rounded">http://127.0.0.1:11434/v1/chat/completions</code>
          </p>
        </div>

        <div>
          <label htmlFor="llm-key" className="text-sm font-medium text-slate-700 mb-1.5 block">
            API key (optional for local Ollama)
          </label>
          <Input
            id="llm-key"
            type="password"
            autoComplete="off"
            placeholder="AIza… or sk-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-white"
          />
          <p className="text-[11px] text-slate-500 mt-1">Stored only in this browser. Never committed to git.</p>
        </div>

        <div>
          <label htmlFor="llm-model" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Model
          </label>
          <Input
            id="llm-model"
            placeholder="gemini-2.0-flash"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-white"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {testMessage && (
          <p className="text-sm text-slate-700 rounded-lg bg-white border border-slate-200 p-3">{testMessage}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEndpoint('https://generativelanguage.googleapis.com/v1beta')
              setModel('gemini-2.0-flash')
            }}
          >
            Use Gemini
          </Button>
          <Button onClick={handleSave} disabled={!endpoint.trim()}>
            Save connection
          </Button>
          <Button variant="outline" onClick={() => void handleTest()} disabled={testing || !endpoint.trim()}>
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Testing…
              </>
            ) : (
              'Test connection'
            )}
          </Button>
          {isConfigured && (
            <Button variant="ghost" onClick={clear} className="text-slate-500 hover:text-red-600">
              <Unplug className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <Toast message="AI model settings saved." visible={saved} onClose={() => setSaved(false)} />
    </div>
  )
}
