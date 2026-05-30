'use client'

import { createPortal } from 'react-dom'

type CreditsModalProps = {
  open: boolean
  onClose: () => void
}

const CREDIT_ITEMS = {
  collaborator: ['ひまゆ'],
  tools: [
    'Next.js',
    'React',
    'Prisma',
    'Tailwind CSS',
    'Supabase',
    'Google Fonts',
    'Font Awesome',
    'Vercel Speed Insights'
  ]
}

export default function CreditsModal({ open, onClose }: CreditsModalProps) {
  if (!open) {
    return null
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="モーダルを閉じる"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 via-white to-amber-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm ring-1 ring-primary-100">
              <i className="fa-regular fa-circle-user text-lg" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-500">Credits</div>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">クレジット</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">協力者と使用素材/フレームワークを表示しています。</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">協力者</h4>
              <ul className="space-y-2 text-base font-medium text-slate-900">
                {CREDIT_ITEMS.collaborator.map((item) => (
                  <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <a
                      href="https://x.com/HF_himayu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-colors hover:text-primary-600"
                    >
                      <span>{item}</span>
                      <span className="text-xs font-normal text-slate-500">さん</span>
                      <i className="fa-brands fa-x-twitter text-sm" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">使用素材/フレームワーク</h4>
              <ul className="space-y-2 text-base font-medium text-slate-900">
                {CREDIT_ITEMS.tools.map((item) => (
                  <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}