import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import userData from '@/data/user.json'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => boolean
  logout: () => void
  userEmail: string
  userName: string
  userAvatar: string
  userRole: string
  updateUserName: (name: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_KEY = 'workpilot_auth'
const EMAIL_KEY = 'workpilot_email'
const REMEMBER_KEY = 'workpilot_remember_email'
const DISPLAY_NAME_KEY = 'workpilot_display_name'

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true'
  })
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem(EMAIL_KEY) || userData.email
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem(DISPLAY_NAME_KEY) || userData.name
  })

  const updateUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed)
    setUserName(trimmed)
  }, [])

  const userAvatar = getInitials(userName)
  const userRole = userData.role

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
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        userEmail,
        userName,
        userAvatar,
        userRole,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
