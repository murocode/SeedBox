"use client"

import React, { useState } from 'react'

export default function CopySeedButton({ seedValue }: { seedValue: string }) {
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
      className="inline-flex items-center justify-center rounded-full text-slate-900/80 transition hover:text-slate-900"
    >
      <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} aria-hidden />
    </button>
  )
}