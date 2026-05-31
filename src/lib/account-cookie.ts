export const ACCOUNT_USER_COOKIE_NAME = 'sb-user'

export type AccountCookieUser = {
  username: string
  email?: string | null
  avatarUrl?: string | null
  role?: 'USER' | 'MODERATOR' | 'ADMIN' | null
}

function sanitizeAccountCookieUser(input: unknown): AccountCookieUser | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  const username = typeof value.username === 'string' ? value.username.trim() : ''
  if (!username) {
    return null
  }

  const roleValue = value.role
  const role = roleValue === 'USER' || roleValue === 'MODERATOR' || roleValue === 'ADMIN' ? roleValue : null

  return {
    username,
    email: typeof value.email === 'string' ? value.email : null,
    avatarUrl: typeof value.avatarUrl === 'string' ? value.avatarUrl : null,
    role
  }
}

export function serializeAccountCookieUser(user: AccountCookieUser | null | undefined): string {
  if (!user) {
    return ''
  }

  const sanitized = sanitizeAccountCookieUser(user)
  if (!sanitized) {
    return ''
  }

  return encodeURIComponent(JSON.stringify(sanitized))
}

export function parseAccountCookieUser(value: string | null | undefined): AccountCookieUser | null {
  if (!value) {
    return null
  }

  try {
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded)
    return sanitizeAccountCookieUser(parsed)
  } catch {
    return null
  }
}

export function readAccountCookieUserFromCookieHeader(cookieHeader: string | null | undefined): AccountCookieUser | null {
  if (!cookieHeader) {
    return null
  }

  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split('=')
    if (rawKey !== ACCOUNT_USER_COOKIE_NAME) {
      continue
    }

    return parseAccountCookieUser(rawValue.join('='))
  }

  return null
}

export function readAccountCookieUserFromDocument(): AccountCookieUser | null {
  if (typeof document === 'undefined') {
    return null
  }

  return readAccountCookieUserFromCookieHeader(document.cookie)
}