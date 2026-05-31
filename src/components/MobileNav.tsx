"use client"
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import PostButton from './PostButton'

type NavItem = { href: string; label: string }

type MobileUser = {
  username: string
  email?: string | null
  avatarUrl?: string | null
  role?: 'USER' | 'MODERATOR' | 'ADMIN'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'トップ' },
  { href: '/seeds', label: 'シード' },
  { href: '/users', label: 'ユーザー' }
]

function getIconForLabel(label: string) {
  switch (label) {
    case 'トップ':
      return <i className="fa-solid fa-house mr-3" aria-hidden />
    case 'シード':
      return <i className="fa-solid fa-magnifying-glass mr-3" aria-hidden />
    case 'ユーザー':
      return <i className="fa-solid fa-users mr-3" aria-hidden />
    default:
      return null
  }
}

export default function MobileNav({ currentUser, canModerate }: { currentUser?: MobileUser | null; canModerate?: boolean }) {
  const [open, setOpen] = useState(false)
  const [resolvedUser, setResolvedUser] = useState<MobileUser | null | undefined>(currentUser)
  const [loading, setLoading] = useState(currentUser === undefined)
  const router = useRouter()

  useEffect(() => {
    if (currentUser !== undefined) {
      setResolvedUser(currentUser)
      setLoading(false)

      if (currentUser && currentUser.role === undefined) {
        let active = true

        async function enrichCurrentUser() {
          try {
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = sessionData.session?.access_token

            if (!accessToken) {
              return
            }

            const response = await fetch('/api/users/me', {
              headers: {
                Authorization: `Bearer ${accessToken}`
              },
              cache: 'no-store'
            })

            if (!response.ok) {
              return
            }

            const data = await response.json().catch(() => ({}))
            if (active && data.user) {
              setResolvedUser(data.user)
            }
          } catch {
            // keep the existing user data; the menu still works without role enrichment
          }
        }

        enrichCurrentUser()

        return () => {
          active = false
        }
      }

      return
    }

    let active = true

    async function loadCurrentUser() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          if (active) {
            setResolvedUser(null)
            setLoading(false)
          }
          return
        }

        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          cache: 'no-store'
        })

        if (!response.ok) {
          if (active) {
            setResolvedUser(null)
            setLoading(false)
          }
          return
        }

        const data = await response.json().catch(() => ({}))
        if (active) {
          setResolvedUser(data.user ?? null)
          setLoading(false)
        }
      } catch {
        if (active) {
          setResolvedUser(null)
          setLoading(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      active = false
    }
  }, [currentUser])

  const user = resolvedUser ?? null
  const hasModerationAccess = user?.role === 'MODERATOR' || user?.role === 'ADMIN'

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // ignore
    }
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  const userLinks = user ? (
    <div className="space-y-2 px-1">
      <a href={`/users/${user.username}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        プロフィール
      </a>
      <a href="/favorites" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        お気に入り
      </a>
      <a href="/settings" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        アカウント設定
      </a>
      {canModerate || hasModerationAccess ? (
        <a href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          管理画面
        </a>
      ) : null}
      <button onClick={handleLogout} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-rose-700">
        ログアウト
      </button>
    </div>
  ) : (
    <div className="px-1">
      <a href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        ログイン / 新規登録
      </a>
    </div>
  )

  return (
    <div className="md:hidden">
      <button
        aria-label="メニューを開く"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white p-2 text-slate-700"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-slate-900/40 z-40" onClick={() => setOpen(false)} aria-hidden />
              <aside className="absolute right-0 top-0 h-full w-[84%] max-w-xs bg-white shadow-2xl overflow-y-auto max-h-full z-50" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <div className="text-lg font-semibold">メニュー</div>
                  <button aria-label="閉じる" onClick={() => setOpen(false)} className="p-2 text-slate-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="px-4 py-4 pb-8">
                  <ul className="space-y-2">
                    {NAV_ITEMS.map(item => (
                      <li key={item.href}>
                        <Link onClick={() => setOpen(false)} href={item.href} className="flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
                          {getIconForLabel(item.label)}
                          <span className="text-base">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    <PostButton
                      onNavigate={() => setOpen(false)}
                      className="inline-block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
                    />
                  </div>

                  {canModerate || hasModerationAccess ? (
                    <div className="mt-3">
                      <a href="/admin" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">管理画面</a>
                    </div>
                  ) : null}

                  <div className="mt-6 border-t pt-4">
                    {loading ? (
                      <div className="space-y-2 px-1">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </div>
                    ) : user ? (
                      <div className="space-y-3 px-1">
                        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-50 via-white to-white px-3 py-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                            ) : (
                              <span>{user.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium uppercase tracking-[0.2em] text-primary-500">Account</div>
                            <div className="truncate text-base font-semibold text-slate-900">@{user.username}</div>
                            {user.email ? <div className="truncate text-xs text-slate-500">{user.email}</div> : null}
                          </div>
                        </div>
                        {userLinks}
                      </div>
                    ) : (
                      userLinks
                    )}
                  </div>
                </nav>
              </aside>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
