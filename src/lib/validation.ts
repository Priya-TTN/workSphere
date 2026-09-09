export interface LoginFormErrors {
  email?: string
  password?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) return 'Work email is required.'
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid work email address.'
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return undefined
}

export function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {}
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  return errors
}
