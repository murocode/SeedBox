'use client'

import SiteShellClient from '../../components/SiteShellClient'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal'

const AUTH_TIMEOUT_MS = 8000

interface UserData {
  username: string
  email: string | null
  bio: string | null
  youtubeUrl: string | null
  xUrl: string | null
  twitchUrl: string | null
  websiteUrl: string | null
  speedrunId: string | null
  oauthAccounts?: { provider: string }[]
}

type SpeedrunIdStatus = 'idle' | 'checking' | 'exists' | 'not-found' | 'error'

export default function SettingsPage() {
  const router = useRouter()
  const suppressNextAuthReloadRef = useRef(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null)
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [speedrunIdStatus, setSpeedrunIdStatus] = useState<SpeedrunIdStatus>('idle')
  const [speedrunIdStatusMessage, setSpeedrunIdStatusMessage] = useState('')

  const oauthLinkingSessionKey = 'settings:oauth-linking-session'
  const oauthLinkingErrorKey = 'settings:oauth-linking-error'

  function clearOauthLinkingState() {
    sessionStorage.removeItem('settings:oauth-linking')
    sessionStorage.removeItem('settings:oauth-linking-email')
    sessionStorage.removeItem(oauthLinkingSessionKey)
    sessionStorage.removeItem(oauthLinkingErrorKey)
  }

  function saveOauthLinkingSession(session: any) {
    if (!session) {
      return
    }

    sessionStorage.setItem(oauthLinkingSessionKey, JSON.stringify({
      access_token: session.access_token ?? session.accessToken ?? '',
      refresh_token: session.refresh_token ?? session.refreshToken ?? ''
    }))
  }

  async function restoreOauthLinkingSession() {
    const rawSession = sessionStorage.getItem(oauthLinkingSessionKey)
    if (!rawSession) {
      return false
    }

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.access_token || !parsedSession?.refresh_token) {
      return false
    }

    const { error } = await supabase.auth.setSession({
      access_token: parsedSession.access_token,
      refresh_token: parsedSession.refresh_token
    })

    return !error
  }

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
        signal: controller.signal
      })

      const data = await response.json().catch(() => ({}))
      return { response, data }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function checkSpeedrunUserExists(username: string) {
    const { response, data } = await fetchJsonWithTimeout(
      '/api/auth/check-speedrun-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      },
      AUTH_TIMEOUT_MS
    )

    if (!response.ok) {
      throw new Error(data?.error || 'Speedrun.com の確認に失敗しました')
    }

    return Boolean(data?.exists)
  }

  async function resolveSessionAccessToken() {
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_TIMEOUT_MS,
      'ログイン情報の取得がタイムアウトしました。もう一度お試しください。'
    )

    if (sessionError) throw sessionError
    return sessionData.session?.access_token ?? null
  }

  async function syncCurrentSession(persistOauthAccounts = false, expectedEmail?: string | null) {
    const accessToken = await resolveSessionAccessToken()
    if (!accessToken) {
      return null
    }

    const { response: syncResponse, data: syncData } = await fetchJsonWithTimeout(
      '/api/auth/sync',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          persist_oauth_accounts: persistOauthAccounts,
          expected_email: expectedEmail ?? undefined
        })
      },
      AUTH_TIMEOUT_MS
    )

    if (!syncResponse.ok) {
      if (syncData?.error === 'EMAIL_MISMATCH') {
        suppressNextAuthReloadRef.current = true
        sessionStorage.setItem(oauthLinkingErrorKey, '同じメールアドレスの外部アカウントでないと連携できません')
        await restoreOauthLinkingSession().catch(() => {})
        clearOauthLinkingState()
        sessionStorage.setItem(oauthLinkingErrorKey, '同じメールアドレスの外部アカウントでないと連携できません')
        throw new Error('同じメールアドレスの外部アカウントでないと連携できません')
      }
      console.warn('session sync failed', syncResponse.status, syncData)
    }

    return accessToken
  }

  const [form, setForm] = useState({
    bio: '',
    youtubeUrl: '',
    xUrl: '',
    twitchUrl: '',
    websiteUrl: '',
    speedrunId: ''
  })

  async function loadUser() {
    try {
      const persistedError = sessionStorage.getItem(oauthLinkingErrorKey)
      if (persistedError) {
        setError(persistedError)
        sessionStorage.removeItem(oauthLinkingErrorKey)
        setLoading(false)
        return
      }

      const shouldPersistOauthAccounts = sessionStorage.getItem('settings:oauth-linking') === '1'
      const expectedEmail = sessionStorage.getItem('settings:oauth-linking-email')

      // Prefer server cookie authentication first to avoid auth lock races in the browser client.
      const cookieUserResult = await fetchJsonWithTimeout('/api/users/me', {}, AUTH_TIMEOUT_MS)
      if (cookieUserResult.response.ok && cookieUserResult.data?.user) {
        setUser(cookieUserResult.data.user)
        setForm({
          bio: cookieUserResult.data.user.bio || '',
          youtubeUrl: cookieUserResult.data.user.youtubeUrl || '',
          xUrl: cookieUserResult.data.user.xUrl || '',
          twitchUrl: cookieUserResult.data.user.twitchUrl || '',
          websiteUrl: cookieUserResult.data.user.websiteUrl || '',
          speedrunId: cookieUserResult.data.user.speedrunId || ''
        })

        if (shouldPersistOauthAccounts) {
          clearOauthLinkingState()
        }
        return
      }

      const accessToken = await syncCurrentSession(shouldPersistOauthAccounts, expectedEmail)
      if (!accessToken) {
        router.push('/login')
        return
      }

      const { response, data } = await fetchJsonWithTimeout(
        '/api/users/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        },
        AUTH_TIMEOUT_MS
      )

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      setUser(data.user)
      setForm({
        bio: data.user.bio || '',
        youtubeUrl: data.user.youtubeUrl || '',
        xUrl: data.user.xUrl || '',
        twitchUrl: data.user.twitchUrl || '',
        websiteUrl: data.user.websiteUrl || '',
        speedrunId: data.user.speedrunId || ''
      })

      if (shouldPersistOauthAccounts) {
        clearOauthLinkingState()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [router])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (suppressNextAuthReloadRef.current) {
        suppressNextAuthReloadRef.current = false
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await loadUser()
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const normalizedSpeedrunId = form.speedrunId.trim()

    if (!normalizedSpeedrunId) {
      setSpeedrunIdStatus('idle')
      setSpeedrunIdStatusMessage('')
      return
    }

    let cancelled = false
    setSpeedrunIdStatus('checking')
    setSpeedrunIdStatusMessage('Speedrun.com で確認中...')

    const timeoutId = window.setTimeout(async () => {
      try {
        const exists = await checkSpeedrunUserExists(normalizedSpeedrunId)

        if (cancelled) {
          return
        }

        if (exists) {
          setSpeedrunIdStatus('exists')
          setSpeedrunIdStatusMessage('✓ Speedrun.com に存在します')
        } else {
          setSpeedrunIdStatus('not-found')
          setSpeedrunIdStatusMessage('Speedrun.com に見つかりません')
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        setSpeedrunIdStatus('error')
        setSpeedrunIdStatusMessage(err instanceof Error ? err.message : 'Speedrun.com の確認に失敗しました')
      }
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [form.speedrunId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const normalizedSpeedrunId = form.speedrunId.trim()
      if (normalizedSpeedrunId) {
        const exists = await checkSpeedrunUserExists(normalizedSpeedrunId)
        if (!exists) {
          setSpeedrunIdStatus('not-found')
          setSpeedrunIdStatusMessage('Speedrun.com に見つかりません')
          throw new Error('Speedrun.com に存在しないユーザー名は登録できません')
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push('/login')
        throw new Error('ログインしてください')
      }

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'プロフィール更新に失敗しました')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccess('プロフィールを更新しました')
      setTimeout(() => {
        router.push(`/users/${user?.username}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  async function performUnlink(provider: string) {
    setShowConfirmUnlink(false)
    setSubmitting(true)
    setError('')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('ログイン情報が見つかりません')

      const res = await fetch('/api/auth/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ provider })
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || '連携解除に失敗しました')
      }

      // refresh user
      const r = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${accessToken}` } })
      if (r.ok) {
        const d = await r.json()
        setUser(d.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  async function performDeleteAccount() {
    setShowConfirmDelete(false)
    setSubmitting(true)
    setError('')
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('ログイン情報が見つかりません')

      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'アカウント削除に失敗しました')
      }

      // ログアウトに失敗しても遷移は止めない
      await supabase.auth.signOut().catch(() => {})

      // トップページに強制遷移
      window.location.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SiteShellClient title="設定" subtitle="読み込み中..." icon="fa-gear">
        <div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-600">
          読み込み中...
        </div>
      </SiteShellClient>
    )
  }

  if (!user) {
    return (
      <SiteShellClient title="設定" subtitle="エラーが発生しました" icon="fa-gear">
        <div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-600">
          {error || 'ユーザー情報が見つかりません'}
        </div>
      </SiteShellClient>
    )
  }

  return (
    <SiteShellClient
      title="プロフィール設定"
      subtitle={`@${user.username} のプロフィール情報を編集します`}
      icon="fa-gear"
      currentUser={{
        username: user.username,
        email: user.email
      }}
    >
      <div className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div id="profile" className="rounded-2xl bg-white border shadow-sm p-6 space-y-4 scroll-mt-28">
            <h3 className="font-semibold text-lg">プロフィール</h3>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">ユーザー名</label>
              <div className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-600 text-sm">
                @{user.username}
              </div>
              <p className="text-xs text-slate-500 mt-1">ユーザー名は変更できません</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">メールアドレス</label>
              <div className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-600 text-sm">
                {user.email || '（未登録）'}
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="text-sm font-semibold text-slate-700 block mb-2">自己紹介</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={500}
                placeholder="あなたについて簡単に紹介してください"
                className="w-full rounded-lg border px-3 py-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <div className="text-xs text-slate-500 mt-1">{form.bio.length} / 500</div>
            </div>

            <div>
              <label htmlFor="speedrunId" className="text-sm font-semibold text-slate-700 block mb-2">
                Speedrun.com ユーザーID
              </label>
              <input
                type="text"
                id="speedrunId"
                name="speedrunId"
                value={form.speedrunId}
                onChange={handleChange}
                placeholder="例: sample-user"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <p className="text-slate-500">
                  1.16.1 RSG のPB自動同期に使用します。登録後は毎日自動同期されます。
                </p>
                <p
                  className={
                    speedrunIdStatus === 'exists'
                      ? 'whitespace-nowrap font-medium text-emerald-600'
                      : speedrunIdStatus === 'not-found' || speedrunIdStatus === 'error'
                        ? 'whitespace-nowrap font-medium text-rose-600'
                        : 'whitespace-nowrap text-slate-400'
                  }
                  aria-live="polite"
                >
                  {speedrunIdStatusMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg">ソーシャルリンク</h3>

            <div>
              <label htmlFor="youtubeUrl" className="text-sm font-semibold text-slate-700 block mb-2">
                YouTube URL
              </label>
              <input
                type="text"
                id="youtubeUrl"
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/@your-channel"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label htmlFor="xUrl" className="text-sm font-semibold text-slate-700 block mb-2">
                X (Twitter) URL
              </label>
              <input
                type="text"
                id="xUrl"
                name="xUrl"
                value={form.xUrl}
                onChange={handleChange}
                placeholder="https://x.com/your-handle"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label htmlFor="twitchUrl" className="text-sm font-semibold text-slate-700 block mb-2">
                Twitch URL
              </label>
              <input
                type="text"
                id="twitchUrl"
                name="twitchUrl"
                value={form.twitchUrl}
                onChange={handleChange}
                placeholder="https://www.twitch.tv/your-channel"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="text-sm font-semibold text-slate-700 block mb-2">
                Webサイト URL
              </label>
              <input
                type="text"
                id="websiteUrl"
                name="websiteUrl"
                value={form.websiteUrl}
                onChange={handleChange}
                placeholder="https://your-website.com"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <p className="text-xs text-slate-500">
              ✓ 登録されたURL は `https://` から始まる必要があります  
              ✓ 未登録の項目は非表示になります
            </p>
          </div>

          <div id="connections" className="rounded-2xl bg-white border shadow-sm p-6 space-y-4 scroll-mt-28">
            <h3 className="font-semibold text-lg">連携プロバイダー</h3>
            <p className="text-xs text-slate-500">
              連携には SeedBox に登録されているメールアドレスと同じメールアドレスの外部アカウントが必要です。
            </p>

            <div className="space-y-3">
              {[
                { provider: 'discord', label: 'Discord' },
                { provider: 'google', label: 'Google' }
              ].map(({ provider, label }) => {
                const connected = user.oauthAccounts?.some(acc => acc.provider === provider)
                const canUnlink = connected && (user.oauthAccounts?.length ?? 0) > 1

                return (
                  <div key={provider} className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
                    <div className="text-sm font-medium text-slate-700">{label}</div>
                    <button
                      type="button"
                      disabled={connected ? !canUnlink : false}
                      onClick={async () => {
                        if (connected) {
                          setUnlinkTarget(provider)
                          setShowConfirmUnlink(true)
                          return
                        }

                          const { data: sessionData } = await supabase.auth.getSession()
                          saveOauthLinkingSession(sessionData.session)
                          sessionStorage.removeItem(oauthLinkingErrorKey)
                        sessionStorage.setItem('settings:oauth-linking-email', user.email ?? '')
                        sessionStorage.setItem('settings:oauth-linking', '1')
                        setSubmitting(true)
                        try {
                          const { error } = await supabase.auth.signInWithOAuth({
                            provider: provider as any,
                            options: {
                              redirectTo: `${window.location.origin}/settings`,
                              queryParams: provider === 'google' ? { prompt: 'consent' } : undefined
                            }
                          })
                          if (error) {
                            setError(error.message || '連携に失敗しました')
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : '連携に失敗しました')
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      className="btn btn-secondary text-sm disabled:opacity-50"
                    >
                      {connected ? '解除' : '連携'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {submitting ? '保存中...' : 'プロフィールを保存'}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={submitting}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {submitting ? '削除中...' : 'アカウントを削除'}
          </button>

          <Modal
            open={showConfirmUnlink}
            title="連携解除"
            onClose={() => setShowConfirmUnlink(false)}
            onConfirm={() => unlinkTarget && performUnlink(unlinkTarget)}
            confirmLabel="解除する"
            cancelLabel="キャンセル"
          >
            本当に {unlinkTarget} の連携を解除しますか？
          </Modal>

          <Modal
            open={showConfirmDelete}
            title="アカウントを削除します"
            onClose={() => setShowConfirmDelete(false)}
            onConfirm={performDeleteAccount}
            confirmLabel="削除する"
            cancelLabel="キャンセル"
          >
            {'このアカウントを削除してもよろしいですか？\n\n⚠️ この操作は取り消せません。\nすべてのシード、フォロー情報、その他のデータが完全に削除されます。'}
          </Modal>
        </form>
      </div>
    </SiteShellClient>
  )
}
