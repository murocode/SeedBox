"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Props = {
  followingOnly: boolean
  orderBy: 'username' | 'pbTime'
}

export default function UsersSearchQuickControls({ followingOnly, orderBy }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function apply(nextFollowingOnly: boolean, nextOrderBy: 'username' | 'pbTime') {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (nextFollowingOnly) {
      params.set('followingOnly', 'true')
    } else {
      params.delete('followingOnly')
    }

    if (nextOrderBy === 'pbTime') {
      params.set('orderBy', 'pbTime')
    } else {
      params.delete('orderBy')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          name="followingOnly"
          type="checkbox"
          checked={followingOnly}
          onChange={event => apply(event.target.checked, orderBy)}
          className="rounded border-slate-300"
        />
        <span className="text-sm text-slate-700">フォロー中のみ</span>
      </label>

      <select
        name="orderBy"
        value={orderBy}
        onChange={event => apply(followingOnly, event.target.value === 'pbTime' ? 'pbTime' : 'username')}
        className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
      >
        <option value="username">ユーザー名順</option>
        <option value="pbTime">PBタイム順</option>
      </select>
    </div>
  )
}
