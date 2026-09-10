import type { LlmSettings } from '@/services/ai/llmSettings'

export async function chatWithLlm(
  settings: LlmSettings,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const response = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      endpoint: settings.endpoint,
      apiKey: settings.apiKey || undefined,
      model: settings.model,
      messages,
    }),
  })
  const payload = (await response.json().catch(() => null)) as { content?: string; error?: string } | null
  if (!response.ok) {
    throw new Error(payload?.error || 'The LLM request failed.')
  }
  if (!payload?.content) {
    throw new Error('The LLM returned an empty answer.')
  }
  return payload.content
}
