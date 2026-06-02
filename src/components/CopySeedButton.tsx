"use client"

import React, { useState } from 'react'

type CopySeedButtonProps = {
  seedValue: string
  showLabel?: boolean
  variant?: 'default' | 'icon' | 'chip'
}

export default function CopySeedButton({ seedValue, showLabel = true, variant = 'default' }: CopySeedButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(seedValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      try {
        const ta = document.createElement('textarea')
        ta.value = seedValue
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (_) {
        // ignore
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy seed"
      className={variant === 'chip'
        ? 'inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-3 py-1 text-slate-900 transition hover:bg-slate-100'
        : 'inline-flex items-center justify-center rounded-full text-white/90 transition hover:text-white'}
    >
      {variant === 'chip' ? <span>Seed</span> : null}
      {variant === 'chip' ? <span className="font-mono break-all">{seedValue}</span> : null}
      <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-clone'} aria-hidden />
      {showLabel ? <span>{copied ? 'コピー済み' : 'コピー'}</span> : null}
    </button>
  )
}
