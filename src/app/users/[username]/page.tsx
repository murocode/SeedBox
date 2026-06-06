import SiteShell from '../../../components/SiteShell'
import SeedCard from '../../../components/SeedCard'
import FollowButton from '../../../components/FollowButton'
import ReportButton from '../../../components/ReportButton'
import SeedGridSkeleton from '../../../components/SeedGridSkeleton'
import UserSeedsClient from '../../../components/UserSeedsClient'
import { cookies } from 'next/headers'
import { prisma } from '../../../lib/prisma'
import { hasModerationAccess, resolveCurrentUser } from '../../../lib/auth'
import { formatTime } from '../../../lib/speedrun'
import { validateUrl } from '../../../lib/validation'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { bio: true, _count: { select: { seeds: true } } },
  })

  const title = `@${username} のプロフィール`
  const description = user?.bio
    ? `@${username} のSeedBoxプロフィール。${user.bio.slice(0, 80)}`
    : `@${username} のSeedBoxプロフィール。投稿シード数: ${user?._count.seeds ?? 0}件。`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | SeedBox`,
      description,
    },
  }
}

export const dynamic = 'force-dynamic'


export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const currentUser = accessToken ? await resolveCurrentUser(accessToken) : null

  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      _count: { select: { seeds: true, followers: true } }
    }
  })

  const seeds = user
    ? await prisma.seed.findMany({
        where: { authorUsername: user.username },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          seedValue: true,
          title: true,
          comment: true,
          owEase: true,
          owTypes: true,
          villageType: true,
          hasBlacksmith: true,
          netherEase: true,
          fortressDistance: true,
          fortressTypes: true,
          fortressToNetherDist: true,
          portalRoomEase: true,
          zeroCycle: true,
          _count: { select: { likes: true, favorites: true } }
        }
      })
    : []

  const seedsWithAuthor = user
    ? seeds.map(seed => ({
        ...seed,
        author: {
          username: user.username,
          avatarUrl: user.avatarUrl,
          speedrunId: user.speedrunId
        }
      }))
    : []

  // Determine whether the current user already liked/favorited each seed
  let likedSet = new Set<number>()
  let favoritedSet = new Set<number>()
  if (currentUser && seeds.length > 0) {
    const seedIds = seeds.map(s => s.id)
    const userLikes = await prisma.like.findMany({ where: { userUsername: currentUser.username, seedId: { in: seedIds } }, select: { seedId: true } })
    const userFavorites = await prisma.favorite.findMany({ where: { userUsername: currentUser.username, seedId: { in: seedIds } }, select: { seedId: true } })
    userLikes.forEach(l => likedSet.add(l.seedId))
    userFavorites.forEach(f => favoritedSet.add(f.seedId))
  }

  if (!user) {
    return (
      <SiteShell title={`@${username}`} subtitle="ユーザーが見つかりませんでした。" icon="fa-user">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">URL を確認してください。</div>
      </SiteShell>
    )
  }

  const isOwnProfile = currentUser?.username === user.username

  const hasSocialLinks = Boolean(
    (user.youtubeUrl && validateUrl(user.youtubeUrl)) ||
      (user.xUrl && validateUrl(user.xUrl)) ||
      (user.twitchUrl && validateUrl(user.twitchUrl)) ||
      (user.websiteUrl && validateUrl(user.websiteUrl))
  )
  const hasProfileExtras = Boolean(user.speedrunId) || hasSocialLinks

  return (
    <SiteShell
      title={`@${username} のユーザーページ`}
      subtitle="ユーザーのプロフィール、PB、フォロー状態、投稿一覧を表示します。"
      icon="fa-user"
    >
      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden flex items-center justify-center text-white font-bold text-xl">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-lg">@{username}</div>
                <div className="mt-1 line-clamp-3 break-words text-sm leading-relaxed text-slate-500">
                  {user.bio || '自己紹介は未設定です'}
                </div>
                {hasModerationAccess(user) && (
                  <div className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    モデレーター
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border bg-slate-50 p-3 text-sm">
              <div>
                <div className="text-slate-500">投稿数</div>
                <div className="font-semibold text-slate-900">{user._count.seeds}</div>
              </div>
              <div>
                <div className="text-slate-500">フォロワー数</div>
                <div className="font-semibold text-slate-900">{user._count.followers}</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-primary-50/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <i className="fa-solid fa-stopwatch" aria-hidden />
                投稿者PB
              </div>
              <p className="mt-2">
                {user.pbTime ? (
                  <>
                    <span className="font-semibold text-lg text-primary-600">{formatTime(user.pbTime)}</span>
                    {user.speedrunId && <span className="ml-2 text-slate-600">/ Speedrun.com: {user.speedrunId}</span>}
                  </>
                ) : user.speedrunId ? (
                  <>
                    <span className="text-slate-600">Speedrun.com: {user.speedrunId}</span>
                    <span className="block text-xs text-slate-500 mt-1">PB情報は次回の同期で更新されます</span>
                  </>
                ) : (
                  'PB はまだ登録されていません。'
                )}
              </p>
            </div>

            {hasProfileExtras && (
              <div className="text-sm text-slate-600">
                {hasSocialLinks && (
                  <div className={user.speedrunId ? 'mt-4' : ''}>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.youtubeUrl && validateUrl(user.youtubeUrl) && (
                        <a href={user.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-900 hover:text-slate-600" title="YouTube">
                          <i className="fa-brands fa-youtube" aria-hidden />
                          <span className="sr-only">YouTube</span>
                        </a>
                      )}

                      {user.xUrl && validateUrl(user.xUrl) && (
                        <a href={user.xUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-900 hover:text-slate-600" title="X">
                          <i className="fa-brands fa-x-twitter" aria-hidden />
                          <span className="sr-only">X</span>
                        </a>
                      )}

                      {user.twitchUrl && validateUrl(user.twitchUrl) && (
                        <a href={user.twitchUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-900 hover:text-slate-600" title="Twitch">
                          <i className="fa-brands fa-twitch" aria-hidden />
                          <span className="sr-only">Twitch</span>
                        </a>
                      )}

                      {user.websiteUrl && validateUrl(user.websiteUrl) && (
                        <a href={user.websiteUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-900 hover:text-slate-600" title="Website">
                          <i className="fa-solid fa-globe" aria-hidden />
                          <span className="sr-only">Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
                      <div className="mt-4 flex flex-wrap gap-2">
              {isOwnProfile ? (
                <a href="/settings" className="btn bg-amber-500 text-white hover:bg-amber-600 text-sm">
                  <i className="fa-solid fa-pen-to-square mr-2" aria-hidden />プロフィールを編集
                </a>
              ) : (
                <FollowButton username={username} />
              )}
              {!isOwnProfile && <ReportButton targetType="user" targetUsername={user.username} />}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div>投稿一覧</div>
          </div>
          {/** Client-rendered seed list */}
          <UserSeedsClient seeds={seedsWithAuthor} likedSet={Array.from(likedSet)} favoritedSet={Array.from(favoritedSet)} />
        </section>
      </div>
    </SiteShell>
  )
}
