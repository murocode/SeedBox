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
        ? 'inline-flex items-center gap-2 rounded-full border border-accent-600 bg-white px-3 py-1 text-accent-700 transition hover:bg-slate-50'
        : 'inline-flex items-center justify-center rounded-full bg-accent-600 text-white transition hover:bg-accent-700'}
    >
      {variant === 'chip' ? <span>Seed</span> : null}
      {variant === 'chip' ? <span className="font-mono break-all">{seedValue}</span> : null}
      <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-clone'} aria-hidden />
      {showLabel ? <span className="ml-2">{copied ? 'コピー済み' : 'コピー'}</span> : null}
    </button>
  )
}
