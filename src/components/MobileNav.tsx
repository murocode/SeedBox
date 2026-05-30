"use client"
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PostButton from './PostButton'

type NavItem = { href: string; label: string }

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

export default function MobileNav({ currentUser, canModerate }: { currentUser?: any | null; canModerate?: boolean }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

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

                  {canModerate ? (
                    <div className="mt-3">
                      <a href="/admin" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">管理画面</a>
                    </div>
                  ) : null}

                  <div className="mt-6 border-t pt-4">
                    {currentUser ? (
                      <div className="space-y-2 px-1">
                        <a href={`/users/${currentUser.username}`} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">プロフィール</a>
                        <a href="/favorites" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">お気に入り</a>
                        <a href="/settings" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">アカウント設定</a>
                        <button onClick={handleLogout} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-rose-700">ログアウト</button>
                      </div>
                    ) : (
                      <div className="px-1">
                        <a href="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">ログイン / 新規登録</a>
                      </div>
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
