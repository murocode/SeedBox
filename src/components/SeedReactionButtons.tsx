"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Props = {
  seedId: number
  initialLikeCount?: number
}
 
 type ClientProps = Props & {
   initialLiked?: boolean
   initialFavorited?: boolean
 }

async function withAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

export default function SeedReactionButtons({ seedId, initialLikeCount = 0, initialLiked = false, initialFavorited = false }: ClientProps) {
  const [loading, setLoading] = useState<'like' | 'favorite' | ''>('')
  const [liked, setLiked] = useState<boolean>(initialLiked)
  const [favorited, setFavorited] = useState<boolean>(initialFavorited)
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount)

  async function toggle(endpoint: 'like' | 'favorite') {
    const isLike = endpoint === 'like'
    const method = (isLike ? liked : favorited) ? 'DELETE' : 'POST'
    setLoading(endpoint)
    try {
      const accessToken = await withAccessToken()
      if (!accessToken) {
        window.location.href = '/login'
        return
      }
      const response = await fetch(`/api/seeds/id/${seedId}/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: accessToken })
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        if (isLike) {
          setLiked(method === 'POST')
          setLikeCount(current => Math.max(0, current + (method === 'POST' ? 1 : -1)))
        } else {
          setFavorited(method === 'POST')
        }
      } else if (response.status === 409 && method === 'POST') {
        // 409 = already liked/favorited — sync UI to server state
        if (isLike) {
          setLiked(true)
          setLikeCount(current => Math.max(0, current + 1))
        } else {
          setFavorited(true)
        }
      }
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex items-center text-base text-slate-500 transition hover:text-rose-500 disabled:opacity-60 px-2 py-1"
        disabled={loading === 'like'}
        onClick={(e) => { e.stopPropagation(); toggle('like') }}
        aria-label={liked ? 'いいねを取り消す' : 'いいねする'}
        title={liked ? 'いいねを取り消す' : 'いいねする'}
      >
        <i className={`${liked ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart ${loading === 'like' ? 'fa-beat' : ''} text-xl`} aria-hidden />
        <span className="ml-2 tabular-nums text-sm md:text-base font-medium">{likeCount}</span>
      </button>
      <button
        className="inline-flex items-center text-base text-slate-500 transition hover:text-amber-500 disabled:opacity-60 px-2 py-1"
        disabled={loading === 'favorite'}
        onClick={(e) => { e.stopPropagation(); toggle('favorite') }}
        aria-label={favorited ? 'お気に入りを解除する' : 'お気に入りに追加する'}
        title={favorited ? 'お気に入りを解除する' : 'お気に入りに追加する'}
      >
        <i className={`${favorited ? 'fa-solid text-amber-500' : 'fa-regular'} fa-star ${loading === 'favorite' ? 'fa-beat' : ''} text-xl`} aria-hidden />
      </button>
    </div>
  )
}
