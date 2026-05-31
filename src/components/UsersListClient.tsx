"use client"

import React from 'react'
import Link from 'next/link'
import { formatTime } from '../lib/speedrun'

type User = {
  username: string
  avatarUrl?: string | null
  bio?: string | null
  pbTime?: number | null
  _count?: { seeds?: number; followers?: number }
}

export default function UsersListClient({ users }: { users: User[] }) {
  if (!users || users.length === 0) {
    return (
      <div className="rounded-2xl bg-white border shadow-sm p-4 text-sm text-slate-600 col-span-full">該当するユーザーがいません。</div>
    )
  }

  return (
    <>
      {users.map(user => (
        <Link
          key={user.username}
          href={`/users/${user.username}`}
          className="rounded-2xl bg-white border shadow-sm p-4 block hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden flex items-center justify-center text-white font-semibold">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">@{user.username}</div>
              <div className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-slate-500">
                {user.bio || 'プロフィール未設定'}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                PB: <span className="font-mono text-slate-700">{user.pbTime == null ? 'PBなし' : formatTime(user.pbTime)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">シード数 {user._count?.seeds} / フォロワー {user._count?.followers}</span>
          </div>
        </Link>
      ))}
    </>
  )
}
