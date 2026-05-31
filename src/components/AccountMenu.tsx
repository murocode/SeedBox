"use client"

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { readAccountCookieUserFromDocument } from '../lib/account-cookie'

type AccountUser = {
  username: string
  email?: string | null
  avatarUrl?: string | null
  role?: 'USER' | 'MODERATOR' | 'ADMIN'
}

type AccountMenuProps = {
  currentUser?: AccountUser | null
  loadCurrentUser?: boolean
}

const ACCOUNT_USER_CACHE_KEY = 'seedbox:account-user'

function readCachedAccountUser(): AccountUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNT_USER_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.username !== 'string') {
      return null
    }

    return {
      username: parsed.username,
      email: typeof parsed.email === 'string' ? parsed.email : null,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null
    }
  } catch {
    return null
  }
}

function writeCachedAccountUser(user: AccountUser | null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (!user) {
      window.localStorage.removeItem(ACCOUNT_USER_CACHE_KEY)
      return
    }

    window.localStorage.setItem(ACCOUNT_USER_CACHE_KEY, JSON.stringify(user))
  } catch {
    // Ignore storage failures; the menu still works without cache.
  }
}

export default function AccountMenu({ currentUser, loadCurrentUser = false }: AccountMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [resolvedUser, setResolvedUser] = useState<AccountUser | null | undefined>(currentUser)
  const [loading, setLoading] = useState(Boolean(loadCurrentUser && currentUser === undefined))

  useEffect(() => {
    if (!loadCurrentUser || currentUser !== undefined) {
      if (currentUser !== undefined) {
        setResolvedUser(currentUser)
        setLoading(false)
        writeCachedAccountUser(currentUser)
      }
      return
    }

    let active = true

    const cachedUser = readCachedAccountUser() ?? readAccountCookieUserFromDocument()
    if (cachedUser) {
      setResolvedUser(cachedUser)
      setLoading(false)
    } else {
      setLoading(true)
    }

    async function loadUser() {
      try {
        const response = await fetch('/api/users/me', {
          cache: 'no-store'
        })

        if (!response.ok) {
          if (active) {
            setResolvedUser(null)
            if (response.status === 401 || response.status === 404) {
              writeCachedAccountUser(null)
            }
          }
          return
        }

        const data = await response.json().catch(() => ({}))
        if (active) {
          const user = data.user ?? null
          setResolvedUser(user)
          writeCachedAccountUser(user)
        }
      } catch {
        if (active) {
          if (!cachedUser) {
            setResolvedUser(null)
          }
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [currentUser, loadCurrentUser])

  // Listen to auth state changes so UI updates immediately after sign-in/sign-out
  useEffect(() => {
    if (!loadCurrentUser) return

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true)
        try {
          const response = await fetch('/api/users/me', {
            cache: 'no-store'
          })
          if (!response.ok) {
            if (response.status === 401 || response.status === 404) {
              setResolvedUser(null)
              writeCachedAccountUser(null)
            }
            return
          }
          const data = await response.json().catch(() => ({}))
          const user = data.user ?? null
          setResolvedUser(user)
          writeCachedAccountUser(user)
        } catch (e) {
          setResolvedUser(null)
        } finally {
          setLoading(false)
        }
      }

      if (event === 'SIGNED_OUT') {
        setResolvedUser(null)
        writeCachedAccountUser(null)
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [loadCurrentUser])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Lock body scroll when drawer is open to avoid layout shifts
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return
  }, [open])

  const user = resolvedUser ?? null
  const profileHref = user ? `/users/${user.username}` : '/login'

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    writeCachedAccountUser(null)
    // Clear server-side SSR cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // ignore
    }
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-36 animate-pulse rounded-full border bg-slate-100" />
      </div>
    )
  }

  if (!user) {
    return (
      <a href="/login" className="rounded-full border bg-white px-3 py-2 text-sm font-medium transition hover:bg-primary-50">
        <i className="fa-solid fa-right-to-bracket mr-2" aria-hidden />ログイン / 新規登録
      </a>
    )
  }

  const avatar = user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
  ) : (
    <span className="text-sm font-semibold text-primary-700">{user.username.charAt(0).toUpperCase()}</span>
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="flex min-w-[13rem] items-center gap-3 rounded-full border bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-primary-200 hover:bg-primary-50"
        aria-expanded={open}
        aria-controls="account-drawer"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white">
          {avatar}
        </div>
        <div className="min-w-0 pr-1 leading-tight">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary-500">Account</div>
          <div className="max-w-36 truncate text-sm font-semibold text-slate-900">@{user.username}</div>
        </div>
        <span className={`mr-1 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="アカウントメニューを閉じる"
                className="fixed inset-0 cursor-default bg-slate-950/20 backdrop-blur-[1px]"
                style={{ zIndex: 9999 }}
                onClick={() => setOpen(false)}
              />
              <aside
                id="account-drawer"
                className="fixed right-0 top-0 h-full w-[min(22rem,100vw)] border-l border-slate-200 bg-white shadow-2xl"
                style={{ zIndex: 10000 }}
              >
                <div className="flex h-full flex-col">
                  <div className="border-b bg-gradient-to-br from-primary-50 via-white to-white px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xl font-bold shadow-sm">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium uppercase tracking-[0.2em] text-primary-500">Account</div>
                        <div className="truncate text-lg font-semibold text-slate-900">@{user.username}</div>
                        {user.email ? <div className="truncate text-sm text-slate-500">{user.email}</div> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 px-5 py-5">
                    <a href={profileHref} onClick={() => setOpen(false)} className="block rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary-200 hover:bg-primary-50">
                      <i className="fa-solid fa-user mr-2" aria-hidden />プロフィール
                    </a>
                    <a href="/favorites" onClick={() => setOpen(false)} className="block rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary-200 hover:bg-primary-50">
                      <i className="fa-solid fa-star mr-2" aria-hidden />お気に入り
                    </a>
                    <a href="/settings" onClick={() => setOpen(false)} className="block rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary-200 hover:bg-primary-50">
                      <i className="fa-solid fa-cog mr-2" aria-hidden />アカウント設定
                    </a>
                  </div>

                  <div className="border-t px-5 py-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <i className="fa-solid fa-right-from-bracket mr-2" aria-hidden />ログアウト
                    </button>
                  </div>
                </div>
              </aside>
            </>,
            (typeof document !== 'undefined' ? document.body : null)!
          )
        : null}
    </div>
  )
}
