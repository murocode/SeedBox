import SiteShell from '../../components/SiteShell'
import Link from 'next/link'
import SeedGridSkeleton from '../../components/SeedGridSkeleton'
import UsersListClient from '../../components/UsersListClient'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { formatTime } from '../../lib/speedrun'
import { prisma } from '../../lib/prisma'
import { resolveCurrentUser } from '../../lib/auth'
import UsersSearchQuickControls from '../../components/UsersSearchQuickControls'
import { ACCOUNT_USER_COOKIE_NAME, parseAccountCookieUser } from '../../lib/account-cookie'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  pbMin?: string
  pbMax?: string
  followingOnly?: string
  orderBy?: string
  page?: string
}

function normalizeUsernameQuery(value: string) {
  return value.trim().replace(/^@+/, '')
}

function parseTimeInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { seconds: null as number | null }
  }

  const parts = trimmed.split(':').map(part => part.trim())
  if (parts.some(part => part === '' || !/^\d+$/.test(part))) {
    return {
      seconds: null as number | null,
      error: 'PBタイムは秒または mm:ss / hh:mm:ss で入力してください'
    }
  }

  const values = parts.map(part => Number(part))
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    return {
      seconds: null as number | null,
      error: 'PBタイムは秒または mm:ss / hh:mm:ss で入力してください'
    }
  }

  if (parts.length === 1) {
    return { seconds: values[0] }
  }

  if (parts.length === 2) {
    return { seconds: values[0] * 60 + values[1] }
  }

  if (parts.length === 3) {
    return { seconds: values[0] * 3600 + values[1] * 60 + values[2] }
  }

  return {
    seconds: null as number | null,
    error: 'PBタイムは秒または mm:ss / hh:mm:ss で入力してください'
  }
}

export default async function UsersPage({ searchParams }: { searchParams?: SearchParams }) {
  const sp = await searchParams
  const query = typeof sp?.q === 'string' ? sp.q.trim() : ''
  const pbMinRaw = typeof sp?.pbMin === 'string' ? sp.pbMin : ''
  const pbMaxRaw = typeof sp?.pbMax === 'string' ? sp.pbMax : ''
  const followingOnly = sp?.followingOnly === 'true'
  const orderBy = sp?.orderBy === 'pbTime' ? 'pbTime' : 'username'

  const normalizedQuery = normalizeUsernameQuery(query)
  const parsedPbMin = parseTimeInput(pbMinRaw)
  const parsedPbMax = parseTimeInput(pbMaxRaw)
  const pbRangeError = parsedPbMin.error || parsedPbMax.error || ''

  const where: Prisma.UserWhereInput = {}
  const andClauses: Prisma.UserWhereInput[] = []
  let currentUser = null

  if (normalizedQuery) {
    andClauses.push({
      username: { contains: normalizedQuery, mode: 'insensitive' }
    })
  }

  const pbTimeFilter: Prisma.IntNullableFilter = {}
  if (parsedPbMin.seconds !== null) {
    pbTimeFilter.gte = parsedPbMin.seconds
  }
  if (parsedPbMax.seconds !== null) {
    pbTimeFilter.lte = parsedPbMax.seconds
  }
  if (Object.keys(pbTimeFilter).length > 0) {
    andClauses.push({ pbTime: pbTimeFilter })
  }

  if (andClauses.length > 0) {
    where.AND = andClauses
  }

  if (followingOnly) {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (accessToken) {
      currentUser = await resolveCurrentUser(accessToken)
    }

    if (!currentUser) {
      const accountUser = parseAccountCookieUser(cookieStore.get(ACCOUNT_USER_COOKIE_NAME)?.value)
      if (accountUser) {
        currentUser = await prisma.user.findUnique({
          where: { username: accountUser.username }
        })
      }
    }

    if (currentUser) {
      where.followers = {
        some: { followerUsername: currentUser.username }
      }
    } else {
      where.username = { equals: '__seedbox_no_authenticated_user__' }
    }
  }

  const pageNum = Math.max(1, Number(sp?.page ? Number(sp.page) : 1) || 1)
  const take = 24
  const skip = (pageNum - 1) * take

  const [users, total] = await Promise.all([
    prisma.user.findMany({
    where,
    orderBy:
      orderBy === 'pbTime'
        ? [{ pbTime: { sort: 'asc', nulls: 'last' } }, { username: 'asc' }]
        : [{ username: 'asc' }],
    skip,
    take,
    include: {
      _count: { select: { seeds: true, followers: true } }
    }
  }),
    prisma.user.count({ where })
  ])

  const activeFilterLabels: string[] = []
  if (normalizedQuery) activeFilterLabels.push(`ユーザー名: ${normalizedQuery}`)
  if (pbMinRaw.trim()) activeFilterLabels.push(`PB下限: ${pbMinRaw.trim()}`)
  if (pbMaxRaw.trim()) activeFilterLabels.push(`PB上限: ${pbMaxRaw.trim()}`)
  if (followingOnly) activeFilterLabels.push('フォロー中のみ')

  return (
    <SiteShell title="ユーザー検索" subtitle="自己PBや投稿されたシード値から、自分と似た感覚のユーザーを見つけましょう。" icon="fa-users">
      <div className="space-y-6">
        <form id="users-search-form" className="space-y-4" action="/users" method="get">
          <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-slate-900">検索フィルター</h3>
              <p className="text-sm text-slate-500 mt-1">条件は AND で適用されます。</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">ユーザー名検索</label>
                <input
                  name="q"
                  defaultValue={query}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="@user でも一部一致でも検索"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">PBタイム下限</label>
                  <input
                    name="pbMin"
                    defaultValue={pbMinRaw}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="例: 600 または 10:00"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">PBタイム上限</label>
                  <input
                    name="pbMax"
                    defaultValue={pbMaxRaw}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="例: 900 または 15:00"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">PBタイムは秒、または {`mm:ss`} / {`hh:mm:ss`} で入力できます。ユーザー名とPBタイムを両方入れた場合は両方で絞り込みます。</p>

              {pbRangeError && <p className="text-xs font-medium text-rose-600">{pbRangeError}</p>}

              <div className="flex gap-3 mt-4">
                <button className="btn btn-primary flex-1" type="submit">検索</button>
                <a href="/users" className="btn btn-secondary">リセット</a>
              </div>
            </div>
          </div>
        </form>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="font-semibold text-slate-900">
              検索結果 <span className="text-primary-600">{total}</span> 件
            </div>

            <UsersSearchQuickControls followingOnly={followingOnly} orderBy={orderBy} />
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <UsersListClient users={users} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {pageNum > 1 ? (
                <Link
                  href={`/users?${new URLSearchParams({
                    ...Object.fromEntries(Object.entries(sp ?? {}).filter(([k, v]) => v !== undefined && k !== 'page')),
                    page: String(pageNum - 1)
                  })}`}
                  className="bg-white border border-slate-200 text-slate-700 rounded-md w-6 h-6 flex items-center justify-center mr-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  aria-label="前のページへ移動"
                >
                  <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
                  <span className="sr-only">前へ</span>
                </Link>
              ) : (
                <button className="bg-white border border-slate-200 text-slate-700 rounded-md w-6 h-6 flex items-center justify-center mr-1 opacity-50" disabled aria-label="前のページへ移動">
                  <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
                  <span className="sr-only">前へ</span>
                </button>
              )}

              <span className="text-sm text-slate-600">{pageNum} / {Math.max(1, Math.ceil(total / take))}</span>

              {pageNum < Math.ceil(total / take) ? (
                <Link
                  href={`/users?${new URLSearchParams({
                    ...Object.fromEntries(Object.entries(sp ?? {}).filter(([k, v]) => v !== undefined && k !== 'page')),
                    page: String(pageNum + 1)
                  })}`}
                  className="bg-white border border-slate-200 text-slate-700 rounded-md w-6 h-6 flex items-center justify-center ml-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  aria-label="次のページへ移動"
                >
                  <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
                  <span className="sr-only">次へ</span>
                </Link>
              ) : (
                <button className="bg-white border border-slate-200 text-slate-700 rounded-md w-6 h-6 flex items-center justify-center ml-1 opacity-50" disabled aria-label="次のページへ移動">
                  <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
                  <span className="sr-only">次へ</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
