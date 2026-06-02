"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CopySeedButton from './CopySeedButton'
import SeedReactionButtons from './SeedReactionButtons'
import ReportButton from './ReportButton'
import {
  DISTANCE_LABELS,
  EASE_LABELS,
  PORTAL_EASE_LABELS,
  ZERO_CYCLE_LABELS,
  formatDate
} from '../lib/seed-domain'

type Author = { id?: number; username?: string | null; avatarUrl?: string | null; speedrunId?: string | null }
type Seed = {
  id: number
  seedValue: string
  title?: string | null
  comment?: string | null
  createdAt?: string | Date
  author?: Author
  owEase?: keyof typeof EASE_LABELS | null
  owTypes?: string[]
  villageType?: string | null
  hasBlacksmith?: boolean | null
  netherEase?: keyof typeof EASE_LABELS | null
  fortressDistance?: keyof typeof DISTANCE_LABELS | null
  fortressTypes?: string[]
  fortressToNetherDist?: keyof typeof DISTANCE_LABELS | null
  portalRoomEase?: keyof typeof PORTAL_EASE_LABELS | null
  zeroCycle?: keyof typeof ZERO_CYCLE_LABELS | null
  _count?: { likes?: number; favorites?: number }
}

type SeedCardProps = {
  seed: Seed
  showAuthor?: boolean
  initialLiked?: boolean
  initialFavorited?: boolean
  actionSlot?: React.ReactNode
  href?: string
}

export default function SeedCard({
  seed,
  showAuthor = true,
  initialLiked = false,
  initialFavorited = false,
  actionSlot
  , href
}: SeedCardProps) {
  const authorUsername = seed.author?.username || 'anonymous'
  const resolvedHref = href ?? `/seeds/${authorUsername}/${seed.seedValue}`
  const router = useRouter()

  function handleKey(e: React.KeyboardEvent) {
    if (!resolvedHref) return
    if (e.key === 'Enter' || e.key === ' ') router.push(resolvedHref)
  }

  const tagClass = (category: 'ow' | 'nether' | 'end') => {
    switch (category) {
      case 'ow':
        return 'rounded-full bg-lime-600 px-2 py-1 text-lime-100'
      case 'nether':
        return 'rounded-full bg-rose-950 px-2 py-1 text-rose-100'
      case 'end':
        return 'rounded-full bg-slate-600 px-2 py-1 text-white'
      default:
        return 'rounded-full bg-slate-100 px-2 py-1'
    }
  }

  return (
    <article
      className={`min-w-0 max-w-full overflow-hidden rounded-xl border bg-white shadow-lg ${resolvedHref ? 'cursor-pointer' : ''}`}
      onClick={() => router.push(resolvedHref)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      <div className="p-4">
        <div className="flex min-w-0 flex-col items-start gap-2">
          {showAuthor && (
            <div className="flex items-center gap-3">
              <Link href={`/users/${authorUsername}`} onClick={(e) => e.stopPropagation()} className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0">
                {seed.author?.avatarUrl ? (
                  <img src={seed.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{seed.author?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </Link>
              <div className="flex flex-col">
                <Link href={`/users/${authorUsername}`} onClick={(e) => e.stopPropagation()} className="text-sm font-medium text-slate-800 hover:text-primary-600">
                  {seed.author?.username || '匿名'}
                </Link>
                <span className="text-xs text-slate-500">投稿日 {formatDate(seed.createdAt)}</span>
              </div>
            </div>
          )}
          <div className="w-full min-w-0">
            <div className="mt-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="min-w-0 flex-1 break-words text-lg font-semibold text-slate-900">{seed.title || '（タイトル未設定）'}</h3>
              </div>

              <div className="flex max-w-full flex-wrap items-center gap-2 text-xs font-medium">
                <CopySeedButton seedValue={seed.seedValue} variant="chip" showLabel={false} />
              </div>
            </div>
            <p className="mt-2 break-words text-sm text-slate-700 line-clamp-3">{seed.comment || '説明なし'}</p>

            <div className="mt-4 flex max-w-full flex-wrap gap-2 text-xs font-medium text-slate-600">
              {seed.owEase ? <span className={tagClass('ow')}>OW: {EASE_LABELS[seed.owEase]}</span> : null}
              {seed.netherEase ? <span className={tagClass('nether')}>ネザー: {EASE_LABELS[seed.netherEase]}</span> : null}
              {seed.fortressDistance ? <span className={tagClass('nether')}>廃要塞距離: {DISTANCE_LABELS[seed.fortressDistance]}</span> : null}
              {seed.fortressToNetherDist ? <span className={tagClass('nether')}>砦距離: {DISTANCE_LABELS[seed.fortressToNetherDist]}</span> : null}
              {seed.portalRoomEase ? <span className={tagClass('end')}>ポータル: {PORTAL_EASE_LABELS[seed.portalRoomEase]}</span> : null}
              {seed.zeroCycle ? <span className={tagClass('end')}>ゼロサイクル: {ZERO_CYCLE_LABELS[seed.zeroCycle]}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t bg-gradient-to-t from-white/60 px-4 py-3 text-sm text-slate-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <SeedReactionButtons
              seedId={seed.id}
              initialLikeCount={seed._count?.likes ?? 0}
              initialLiked={initialLiked}
              initialFavorited={initialFavorited}
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {actionSlot ?? (
              <ReportButton
                targetType="seed"
                targetSeedId={seed.id}
                targetSeedValue={seed.seedValue}
                targetAuthorUsername={seed.author?.username ?? undefined}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
