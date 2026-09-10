import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  clearLlmSettings,
  getLlmSettings,
  isLlmConfigured,
  saveLlmSettings,
  type LlmSettings,
} from '@/services/ai/llmSettings'

interface LlmContextType {
  settings: LlmSettings
  isConfigured: boolean
  save: (settings: LlmSettings) => void
  clear: () => void
}

const LlmContext = createContext<LlmContextType | null>(null)

export function LlmProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LlmSettings>(() => getLlmSettings())

  const save = useCallback((next: LlmSettings) => {
    saveLlmSettings(next)
    setSettings(getLlmSettings())
  }, [])

  const clear = useCallback(() => {
    clearLlmSettings()
    setSettings(getLlmSettings())
  }, [])

  return (
    <LlmContext.Provider
      value={{
        settings,
        isConfigured: isLlmConfigured() && Boolean(settings.endpoint),
        save,
        clear,
      }}
    >
      {children}
    </LlmContext.Provider>
  )
}

export function useLlm() {
  const ctx = useContext(LlmContext)
  if (!ctx) throw new Error('useLlm must be used within LlmProvider')
  return ctx
}
