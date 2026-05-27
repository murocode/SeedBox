'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'

export type SupportCategory = 'CONTACT' | 'BUG' | 'FEATURE' | 'REPORT'

export type SupportTarget =
  | {
      type: 'user'
      username: string
    }
  | {
      type: 'seed'
      seedId: number
      seedValue: string
      authorUsername: string
    }

export const SUPPORT_CATEGORY_OPTIONS: Array<{
  value: SupportCategory
  label: string
  description: string
}> = [
  { value: 'CONTACT', label: 'お問い合わせ', description: 'ご利用に関する質問や連絡' },
  { value: 'BUG', label: 'バグ報告', description: '不具合や表示崩れの報告' },
  { value: 'FEATURE', label: '機能リクエスト', description: 'ほしい機能や改善案' },
  { value: 'REPORT', label: '通報', description: '規約違反や問題のある投稿の報告' }
]

const CATEGORY_LABEL_MAP: Record<SupportCategory, string> = {
  CONTACT: 'お問い合わせ',
  BUG: 'バグ報告',
  FEATURE: '機能リクエスト',
  REPORT: '通報'
}

function getSupportTargetSummary(target?: SupportTarget) {
  if (!target) return null

  if (target.type === 'user') {
    return `対象のユーザー: @${target.username}`
  }

  return `対象の投稿: seed ${target.seedValue} / 投稿者: @${target.authorUsername}`
}

type SupportModalProps = {
  open: boolean
  initialCategory?: SupportCategory
  target?: SupportTarget
  onClose: () => void
  lockCategory?: boolean
}

export default function SupportModal({ open, initialCategory = 'CONTACT', target, onClose, lockCategory = false }: SupportModalProps) {
  const [category, setCategory] = useState<SupportCategory>(initialCategory)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const targetSummary = useMemo(() => getSupportTargetSummary(target), [target])

  useEffect(() => {
    if (!open) return

    setCategory(initialCategory)
    setMessage('')
    setLoading(false)
    setError('')
    setSubmitted(false)
  }, [open, initialCategory, target?.type, target?.type === 'user' ? target.username : target?.type === 'seed' ? target.seedId : null, target?.type === 'seed' ? target.seedValue : null, target?.type === 'seed' ? target.authorUsername : null])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const categoryLabel = CATEGORY_LABEL_MAP[category]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('内容は必須です')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          category,
          message: trimmedMessage,
          reason: 'OTHER',
          targetType: target?.type,
          targetSeedId: target?.type === 'seed' ? target.seedId : undefined,
          targetUsername: target?.type === 'user' ? target.username : undefined
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || '送信に失敗しました')
      }

      setSubmitted(true)
    } catch (submitError: any) {
      setError(submitError?.message || '送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="モーダルを閉じる"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 via-white to-amber-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm ring-1 ring-primary-100">
              <i className="fa-solid fa-envelope-open-text text-lg" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-500">Support</div>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                {submitted ? '送信完了' : `${categoryLabel}を送信`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {submitted
                  ? '内容を受け付けました。必要に応じて管理側で確認します。'
                  : 'カテゴリを選んで、内容を入力してください。'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                {categoryLabel}を受け付けました。
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto block rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                閉じる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">種類</span>
                  <select
                    value={category}
                    onChange={event => setCategory(event.target.value as SupportCategory)}
                    disabled={lockCategory}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                  >
                    {SUPPORT_CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-800">{categoryLabel}</div>
                  <div className="mt-1 leading-6">
                    {SUPPORT_CATEGORY_OPTIONS.find(option => option.value === category)?.description}
                  </div>
                </div>
              </div>

              {targetSummary ? (
                <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                  {targetSummary}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">内容</span>
                <textarea
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  required
                  rows={7}
                  placeholder="内容を入力してください"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                />
              </label>

              {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? '送信中...' : `${categoryLabel}を送信`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}