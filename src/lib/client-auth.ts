import { supabase } from './supabaseClient'

export type ClientUser = {
  username: string
  email?: string | null
  avatarUrl?: string | null
}

const AUTH_TIMEOUT_MS = 8000

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    })
  ])
}

async function fetchJsonWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, {
      ...init,
      credentials: 'include',
      signal: controller.signal
    })

    const data = await response.json().catch(() => ({}))
    return { response, data }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchCurrentUserFromCookie() {
  const { response, data } = await fetchJsonWithTimeout('/api/users/me', {}, AUTH_TIMEOUT_MS)
  if (!response.ok) {
    return null
  }

  return (data?.user ?? null) as ClientUser | null
}

async function fetchCurrentUserWithToken(accessToken: string) {
  const { response, data } = await fetchJsonWithTimeout(
    '/api/users/me',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    AUTH_TIMEOUT_MS
  )

  if (!response.ok) {
    return null
  }

  return (data?.user ?? null) as ClientUser | null
}

export async function resolveCurrentUserClient(): Promise<ClientUser | null> {
  const cookieUser = await fetchCurrentUserFromCookie()
  if (cookieUser) {
    return cookieUser
  }

  const sessionResult = await withTimeout(
    supabase.auth.getSession(),
    AUTH_TIMEOUT_MS,
    'ログイン情報の取得がタイムアウトしました。'
  ).catch(() => null)

  const accessToken = sessionResult?.data.session?.access_token
  if (!accessToken) {
    return null
  }

  const synced = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_token: accessToken,
      persist_oauth_accounts: false
    })
  }).catch(() => null)

  if (synced?.ok) {
    const syncedUser = await fetchCurrentUserFromCookie()
    if (syncedUser) {
      return syncedUser
    }
  }

  return await fetchCurrentUserWithToken(accessToken)
}