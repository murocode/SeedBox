"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Props = {
  username: string
}

export default function FollowButton({ username }: Props) {
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleFollow() {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      if (!accessToken) {
        window.location.href = '/login'
        return
      }

      if (following) {
        await fetch(`/api/users/${username}/follow`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
        })
        setFollowing(false)
      } else {
        await fetch(`/api/users/${username}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ access_token: accessToken })
        })
        setFollowing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    async function check() {
      setChecking(true)
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      try {
        if (!accessToken) {
          if (mounted) setFollowing(false)
          return
        }

        const res = await fetch(`/api/users/${username}/follow`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (!res.ok) {
          if (mounted) setFollowing(false)
          return
        }
        const json = await res.json()
        if (mounted) setFollowing(Boolean(json.following))
      } catch (e) {
        if (mounted) setFollowing(false)
      } finally {
        if (mounted) setChecking(false)
      }
    }

    check()
    return () => { mounted = false }
  }, [username])

  const disabled = loading || checking

  return (
    <button
      className={`btn ${following ? 'btn-outline' : 'btn-primary'} text-sm disabled:opacity-60`}
      onClick={handleFollow}
      disabled={disabled}
    >
      {checking || loading ? '処理中...' : (
        following ? <><i className="fa-solid fa-user-check mr-2" aria-hidden />フォロー中</> : <><i className="fa-solid fa-user-plus mr-2" aria-hidden />フォロー</>
      )}
    </button>
  )
}
