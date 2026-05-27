'use client'

import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title?: string
  children?: ReactNode
  onClose?: () => void
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  loading?: boolean
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  showCancel = true,
  loading = false
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full mx-auto p-6"
      >
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}

        <div className="mb-4 text-sm text-slate-700 whitespace-pre-wrap">{children}</div>

        <div className="flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
          )}

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
          >
            {loading ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
