import React from 'react'
import Link from 'next/link'

function formatTime(seconds?: number | null) {
  if (!seconds) return 'PBなし'
  const totalMilliseconds = Math.round(seconds * 1000)
  const minutes = Math.floor(totalMilliseconds / 60000)
  const remainingSeconds = Math.floor((totalMilliseconds % 60000) / 1000)
  const milliseconds = String(totalMilliseconds % 1000).padStart(3, '0')
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}.${milliseconds}`
}

export default function PlayerCard({ player }: { player: { username: string; avatarUrl?: string | null; pbTime?: number | null } }) {
  return (
    <article className="bg-white rounded-xl shadow-sm border p-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold text-lg overflow-hidden">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{player.username?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-800">{player.username}</div>
          <div className="text-xs text-slate-500">PB: <span className="font-mono">{formatTime(player.pbTime)}</span></div>
        </div>
        <Link href={`/users/${player.username}`} className="text-sm text-primary-600">プロフィール</Link>
      </div>
    </article>
  )
}
