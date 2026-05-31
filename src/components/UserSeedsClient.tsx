"use client"

import React from 'react'
import SeedCard from './SeedCard'

type Seed = any

export default function UserSeedsClient({
  seeds,
  likedSet = [],
  favoritedSet = []
}: {
  seeds: Seed[]
  likedSet?: number[]
  favoritedSet?: number[]
}) {
  if (!seeds || seeds.length === 0) {
    return <div className="rounded-2xl bg-white border shadow-sm p-5 text-sm text-slate-600">まだ投稿がありません。</div>
  }

  return (
    <>
      {seeds.map(seed => (
        <SeedCard
          key={seed.id}
          seed={seed as any}
          initialLiked={Array.isArray(likedSet) ? likedSet.includes(seed.id) : false}
          initialFavorited={Array.isArray(favoritedSet) ? favoritedSet.includes(seed.id) : false}
        />
      ))}
    </>
  )
}
