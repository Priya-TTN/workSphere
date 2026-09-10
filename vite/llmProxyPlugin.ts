import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

interface LlmProxyBody {
  endpoint?: string
  apiKey?: string
  model?: string
  messages?: { role: string; content: string }[]
}

function readJson(req: IncomingMessage): Promise<LlmProxyBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? (JSON.parse(raw) as LlmProxyBody) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function isAllowedEndpoint(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isGeminiRequest(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    return url.hostname.includes('generativelanguage.googleapis.com') && !url.pathname.includes('/openai/')
  } catch {
    return false
  }
}

function resolveGeminiUrl(endpoint: string, model: string, apiKey: string): string {
  const url = new URL(endpoint)
  if (!url.pathname.includes(':generateContent')) {
    const name = model.trim() || 'gemini-2.0-flash'
    url.pathname = `/v1beta/models/${encodeURIComponent(name)}:generateContent`
  }
  if (apiKey && !url.searchParams.has('key')) {
    url.searchParams.set('key', apiKey)
  }
  return url.toString()
}

function toGeminiPayload(messages: { role: string; content: string }[]) {
  const system = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }))
  return {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents,
    generationConfig: { temperature: 0.3 },
  }
}

function extractAnswer(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  const candidates = record.candidates
  if (Array.isArray(candidates) && candidates[0] && typeof candidates[0] === 'object') {
    const content = (candidates[0] as Record<string, unknown>).content as Record<string, unknown> | undefined
    const parts = content?.parts
    if (Array.isArray(parts)) {
      return parts
        .map((part) => (typeof part === 'object' && part && 'text' in part ? String((part as { text?: string }).text ?? '') : ''))
        .join('')
        .trim()
    }
  }
  const choices = record.choices
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === 'object') {
    const choice = choices[0] as Record<string, unknown>
    const message = choice.message as Record<string, unknown> | undefined
    if (typeof message?.content === 'string') return message.content
    if (typeof choice.text === 'string') return choice.text
  }
  const message = record.message as Record<string, unknown> | undefined
  if (typeof message?.content === 'string') return message.content
  if (typeof record.content === 'string') return record.content
  if (typeof record.output_text === 'string') return record.output_text
  return ''
}

async function handleLlmChat(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Use POST.' })
    return
  }

  let body: LlmProxyBody
  try {
    body = await readJson(req)
  } catch {
    sendJson(res, 400, { error: 'Could not read the request.' })
    return
  }

  const endpoint = body.endpoint?.trim() ?? ''
  if (!isAllowedEndpoint(endpoint)) {
    sendJson(res, 400, { error: 'Enter a valid http(s) LLM API URL.' })
    return
  }
  if (!body.messages?.length) {
    sendJson(res, 400, { error: 'No chat messages were sent.' })
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  const gemini = isGeminiRequest(endpoint)
  const apiKey = body.apiKey?.trim() ?? ''
  if (apiKey && !gemini) {
    headers.Authorization = `Bearer ${apiKey}`
  }
  if (apiKey && gemini) {
    headers['x-goog-api-key'] = apiKey
  }

  const target = gemini ? resolveGeminiUrl(endpoint, body.model ?? '', apiKey) : endpoint
  const payload = gemini
    ? toGeminiPayload(body.messages)
    : {
        model: body.model?.trim() || 'gpt-4o-mini',
        messages: body.messages,
        temperature: 0.3,
        stream: false,
      }

  try {
    const response = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    })
    const data: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const errRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const nested = errRecord?.error
      const message =
        (typeof nested === 'object' && nested && 'message' in nested
          ? String((nested as { message?: string }).message)
          : null) ||
        (typeof errRecord?.message === 'string' ? errRecord.message : null) ||
        `The LLM API returned ${response.status}.`
      sendJson(res, 502, { error: message })
      return
    }
    const content = extractAnswer(data)
    if (!content) {
      const feedback = data && typeof data === 'object' ? (data as Record<string, unknown>).promptFeedback : null
      const blocked =
        feedback && typeof feedback === 'object' && 'blockReason' in feedback
          ? String((feedback as { blockReason?: string }).blockReason)
          : ''
      sendJson(res, 502, {
        error: blocked
          ? `Gemini blocked the prompt (${blocked}). Try a shorter question.`
          : 'The LLM API responded, but no text was returned. Check the endpoint and model name.',
      })
      return
    }
    sendJson(res, 200, { content })
  } catch {
    sendJson(res, 502, { error: 'Could not reach the LLM API. Check the URL, CORS is handled here, and that the server is running.' })
  }
}

export function llmProxyPlugin(): Plugin {
  return {
    name: 'llm-proxy',
    configureServer(server) {
      server.middlewares.use('/api/llm/chat', (req, res, next) => {
        void handleLlmChat(req, res).catch(next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/llm/chat', (req, res, next) => {
        void handleLlmChat(req, res).catch(next)
      })
    },
  }
}
