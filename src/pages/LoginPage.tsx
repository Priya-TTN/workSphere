import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  LayoutGrid,
  Calendar,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { validateEmail, validatePassword, validateLoginForm, type LoginFormErrors } from '@/lib/validation'
import { cn } from '@/lib/utils'

const REMEMBER_KEY = 'workpilot_remember_email'

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 21 21" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY)
    if (remembered) {
      setEmail(remembered)
      setRemember(true)
    }
  }, [])

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      login('harsh.sharma@company.com', 'microsoft-sso', true)
      navigate(redirectTo, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }))
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })

    const formErrors = validateLoginForm(email, password)
    setErrors(formErrors)
    if (formErrors.email || formErrors.password) return

    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      login(email.trim(), password, remember)
      navigate(redirectTo, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(forgotEmail)
    if (emailError) return
    setForgotSent(true)
  }

  const handleForgotClose = () => {
    setForgotOpen(false)
    setForgotSent(false)
    setForgotEmail('')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branded panel — 45% */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy-900 relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-8 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-24 right-6 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Logo size="lg" showSubtext={true} lightText={true} className="mb-14" />

          <h2 className="text-[1.75rem] xl:text-3xl font-bold text-white leading-snug mb-5 max-w-md">
            Turn fragmented work into your smartest next action.
          </h2>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-md">
            WorkPilot AI brings your tasks, emails, Teams messages, Jira work, calendar and
            documents into one intelligent workspace.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative z-10 grid grid-cols-2 gap-3"
        >
          {[
            { icon: Sparkles, label: 'AI prioritization' },
            { icon: LayoutGrid, label: 'Jira & Teams sync' },
            { icon: Calendar, label: 'Smart calendar' },
            { icon: FileText, label: 'Document insights' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl bg-navy-800/50 border border-navy-600/60 px-3.5 py-3 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right login panel — 55% */}
      <div className="flex flex-1 lg:w-[55%] flex-col min-h-screen bg-slate-50">
        {/* Mobile branded header */}
        <div className="lg:hidden bg-navy-900 px-6 py-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Logo size="md" showSubtext={true} lightText={true} />
          </div>
          <p className="relative z-10 text-sm text-slate-400 mt-4 leading-relaxed">
            Turn fragmented work into your smartest next action.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-[420px]"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Sign in to continue to WorkPilot AI
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (touched.email) {
                          setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))
                        }
                      }}
                      onBlur={() => handleBlur('email')}
                      placeholder="you@company.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={cn(
                        'flex h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
                        errors.email && touched.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-slate-200 focus:border-purple-300 focus:ring-purple-100'
                      )}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-500" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (touched.password) {
                          setErrors((prev) => ({
                            ...prev,
                            password: validatePassword(e.target.value),
                          }))
                        }
                      }}
                      onBlur={() => handleBlur('password')}
                      placeholder="Enter your password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className={cn(
                        'flex h-11 w-full rounded-lg border bg-white pl-10 pr-11 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
                        errors.password && touched.password
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-slate-200 focus:border-purple-300 focus:ring-purple-100'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide characters' : 'Show characters'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p id="password-error" className="mt-1.5 text-xs text-red-500" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotOpen(true)
                    }}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium text-slate-400 tracking-wide">
                    OR
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm font-medium"
                size="lg"
                onClick={handleMicrosoftLogin}
                disabled={loading}
              >
                <MicrosoftIcon />
                Continue with Microsoft
              </Button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              WorkPilot AI • Enterprise productivity assistant
            </p>
          </motion.div>
        </div>
      </div>

      {/* Forgot password modal */}
      <Modal
        open={forgotOpen}
        onOpenChange={(open) => {
          if (!open) handleForgotClose()
        }}
        title={forgotSent ? 'Check your inbox' : 'Reset your password'}
        description={
          forgotSent
            ? undefined
            : 'Enter your work email and we\'ll send you a reset link.'
        }
      >
        {forgotSent ? (
          <div className="text-center py-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 border border-green-200">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              If an account exists for{' '}
              <span className="font-medium text-slate-800">{forgotEmail}</span>, you will
              receive a password reset link shortly.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              This is an MVP demo — no email is actually sent.
            </p>
            <Button className="w-full mt-5" onClick={handleForgotClose}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Work Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!forgotEmail.trim()}>
                Send Reset Link
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleForgotClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
