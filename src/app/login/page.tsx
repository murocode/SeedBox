"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import SiteShellClient from '../../components/SiteShellClient'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 既にログイン済みの場合は自動リダイレクト
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // ユーザーがDB上に存在するかチェック（sync前に確認）
        try {
          const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          })
          const data = await response.json().catch(() => ({}))
          
          if (response.ok && data.exists) {
            // 既存ユーザーの場合、sync を呼んでクッキーを設定してからリダイレクト
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: session.access_token ?? ((session as any).accessToken) ?? session.user?.id })
            }).catch(() => null)
            router.push('/')
          } else {
            if (!response.ok) {
              console.warn('check user failed', response.status, data)
            }
            // 新規ユーザーの場合はsyncを呼ばずにusername-setupへ
            router.push('/auth/username-setup')
          }
        } catch (e) {
          console.error('check user failed', e)
          router.push('/auth/username-setup')
        }
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // ログイン直後にユーザー設定ページへリダイレクト
        try {
          // ユーザーがDB上に存在するかチェック（sync前に確認）
          const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          })
          const data = await response.json().catch(() => ({}))
          
          if (response.ok && data.exists) {
            // 既存ユーザーの場合、sync を呼んでクッキーを設定してからリダイレクト
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: session.access_token ?? ((session as any).accessToken) ?? session.user?.id })
            }).catch(() => null)
            router.push('/')
          } else {
            if (!response.ok) {
              console.warn('redirect check failed', response.status, data)
            }
            // 新規ユーザーの場合はsyncを呼ばずにusername-setupへ
            router.push('/auth/username-setup')
          }
        } catch (e) {
          console.error('redirect check failed', e)
          router.push('/auth/username-setup')
        }
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  async function handleOAuth(provider: 'discord' | 'google') {
    setLoading(true)
    // 明示的にログイン後のリダイレクト先をログインページに指定する
    // これにより OAuth のコールバック後に `/login` がマウントされ、
    // onAuthStateChange / getSession のチェックで username-setup へ遷移できるようになる
    const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) + '/login'
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) console.error(error)
    setLoading(false)
  }

  return (
    <SiteShellClient title="SeedBox for Minecraft Speedrunning へログイン" subtitle="Discord または Google アカウントでログイン・登録できます。" icon="fa-right-to-bracket">
      <div className="max-w-md mx-auto rounded-2xl bg-white border shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-2">ログイン / 登録</h2>
        <p className="text-sm text-slate-600 mb-5">初回ログイン時にユーザー名を設定します。</p>
        <div className="space-y-3">
          <button
            className="w-full btn btn-primary"
            onClick={() => handleOAuth('discord')}
            disabled={loading}
          >
            <i className="fa-brands fa-discord mr-2" aria-hidden />Discordでログイン
          </button>
          <button
            className="w-full btn btn-secondary"
            onClick={() => handleOAuth('google')}
            disabled={loading}
          >
            <i className="fa-brands fa-google mr-2" aria-hidden />Googleでログイン
          </button>
        </div>
      </div>
    </SiteShellClient>
  )
}
