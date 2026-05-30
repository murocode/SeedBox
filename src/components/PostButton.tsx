"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

type PostButtonProps = {
  className?: string
  onNavigate?: () => void
}

export default function PostButton({ className, onNavigate }: PostButtonProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  async function resolvePostTarget() {
    const meResponse = await fetch('/api/users/me', {
      credentials: 'include'
    }).catch(() => null)

    if (meResponse?.ok) {
      return '/seeds/new'
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      return '/login'
    }

    const syncResponse = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, persist_oauth_accounts: false })
    }).catch(() => null)

    return syncResponse?.ok ? '/seeds/new' : '/login'
  }

  const handleClick = async () => {
    if (checking) {
      return
    }

    setChecking(true)
    try {
      const target = await resolvePostTarget()
      onNavigate?.()
      router.push(target)
    } finally {
      setChecking(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking}
      className={className}
      aria-busy={checking}
    >
      <i className="fa-solid fa-plus mr-2" aria-hidden />
      投稿
    </button>
  )
}