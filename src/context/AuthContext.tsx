import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => boolean
  logout: () => void
  userEmail: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_KEY = 'workpilot_auth'
const EMAIL_KEY = 'workpilot_email'
const REMEMBER_KEY = 'workpilot_remember_email'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true'
  })
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem(EMAIL_KEY) || 'harsh.sharma@company.com'
  })

  const login = useCallback((email: string, _password: string, remember = false) => {
    localStorage.setItem(AUTH_KEY, 'true')
    localStorage.setItem(EMAIL_KEY, email)
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    setUserEmail(email)
    setIsAuthenticated(true)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
