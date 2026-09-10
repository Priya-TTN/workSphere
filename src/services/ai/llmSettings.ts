const ENDPOINT_KEY = 'workpilot_llm_endpoint'
const API_KEY_KEY = 'workpilot_llm_api_key'
const MODEL_KEY = 'workpilot_llm_model'

export interface LlmSettings {
  endpoint: string
  apiKey: string
  model: string
}

export function getLlmSettings(): LlmSettings {
  return {
    endpoint: localStorage.getItem(ENDPOINT_KEY)?.trim() ?? '',
    apiKey: localStorage.getItem(API_KEY_KEY) ?? '',
    model: localStorage.getItem(MODEL_KEY)?.trim() || 'gpt-4o-mini',
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  localStorage.setItem(ENDPOINT_KEY, settings.endpoint.trim())
  if (settings.apiKey.trim()) {
    localStorage.setItem(API_KEY_KEY, settings.apiKey.trim())
  } else {
    localStorage.removeItem(API_KEY_KEY)
  }
  localStorage.setItem(MODEL_KEY, settings.model.trim() || 'gpt-4o-mini')
}

export function clearLlmSettings(): void {
  localStorage.removeItem(ENDPOINT_KEY)
  localStorage.removeItem(API_KEY_KEY)
  localStorage.removeItem(MODEL_KEY)
}

export function isLlmConfigured(): boolean {
  return Boolean(getLlmSettings().endpoint)
}

export function validateLlmEndpoint(raw: string): string | null {
  const value = raw.trim()
  if (!value) return 'Paste your LLM API URL.'
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'That does not look like a valid URL.'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'The API URL must start with http:// or https://'
  }
  return null
}
