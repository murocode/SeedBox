"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import SiteShellClient from '../../../components/SiteShellClient'
import { getSupabaseProviders } from '../../../lib/supabase-auth'

export default function UsernameSetupPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState('')
  

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setSession(session)

      // ユーザーメタデータから初期表示名とアバター取得
      const user = session.user
      // user_metadata に Discord の識別子などが入るため、より人間向けの `full_name` を優先して使う
      const displayName =
        user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || (user.email ? user.email.split('@')[0] : '') || 'User'
      const avatarUrl = user.user_metadata?.avatar_url || ''

      setDisplayName(displayName)
      setAvatarUrl(avatarUrl)
      // デバッグログ: セッションのメタ情報と初期表示名・アバター
      console.log('username-setup: session user metadata:', user.user_metadata)
      console.log('username-setup: displayName:', displayName, 'avatarUrl:', avatarUrl)

      // 初期ユーザー名候補はサーバー側の提案を使わず生成する
      setUsername(generateDefaultUsername(displayName))
      setLoading(false)
    }

    getSession()
  }, [router])

  const generateDefaultUsername = (displayName: string): string => {
    // 英数字、アンダースコア、ハイフンのみに変換
    const cleaned = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 20)
    return cleaned || 'user'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!username.trim()) {
      setError('ユーザー名を入力してください')
      setSubmitting(false)
      return
    }

    if (username.length < 3 || username.length > 30) {
      setError('ユーザー名は3〜30文字で入力してください')
      setSubmitting(false)
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です')
      setSubmitting(false)
      return
    }

    try {
      // ユーザー作成・更新API呼び出し（重複チェックと自動生成はサーバー側で行う）
      const createResponse = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token ?? session.accessToken}`
        },
        body: JSON.stringify({
          username,
          email: session.user.email,
          avatarUrl,
          provider: getSupabaseProviders(session.user)[0],
          providerAccountId: session.user.id
        })
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        if (createData.error === 'USERNAME_TAKEN') {
          setError('このユーザー名はすでに使用されています')
          setSubmitting(false)
          return
        }
        throw new Error(createData.error || 'Failed to create user')
      }

      // セットアップ完了後、トップページへリダイレクト
      // 注: create-user で既にユーザーが作成されているため、ここで sync を呼ぶと
      // メタデータから生成されたユーザー名で上書きされてしまう。
      // sync は /login ページの既存ユーザーのフローでのみ呼ぶ。
      router.push('/')
    } catch (err) {
      console.error('Setup failed:', err)
      setError(err instanceof Error ? err.message : 'セットアップに失敗しました')
      setSubmitting(false)
    }
  }

  // ユーザー名手動入力時に空白除去・小文字化
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setUsername(v.replace(/[^a-zA-Z0-9_-]/g, ''))
  }

  if (loading) {
    return (
      <SiteShellClient title="ユーザー名設定" subtitle="セットアップ中..." icon="fa-user-pen">
        <div className="max-w-md mx-auto text-center py-8">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </SiteShellClient>
    )
  }

  return (
    <SiteShellClient title="ユーザー名設定" subtitle="初回ログイン時にユーザー名を決めてください。後から変更することはできません。" icon="fa-user-pen">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border shadow-lg p-6">
          {/* アバター表示 */}
          {avatarUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-slate-200"
              />
            </div>
          )}

          {/* 初期表示名は表示せず、ユーザー名欄に初期値を入れる */}

          {/* ユーザー名入力 */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              ユーザー名 <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="example_user"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              3〜30文字、英数字・アンダースコア・ハイフンのみ使用可能。変更不可。
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 候補表示は不要のため削除 */}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'セットアップ中...' : 'ユーザー名を設定'}
          </button>
        </form>
      </div>
    </SiteShellClient>
  )
}
