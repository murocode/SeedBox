import SiteShell from '../../../../components/SiteShell'
import SeedCard from '../../../../components/SeedCard'
import SeedGrid from '../../../../components/SeedGrid'
import SeedDetailCopyButton from '@/components/SeedDetailCopyButton'
import SeedActionButtons from '../../../../components/SeedActionButtons'
import ReportButton from '../../../../components/ReportButton'
import FollowButton from '../../../../components/FollowButton'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../lib/auth'
import { formatTime } from '../../../../lib/speedrun'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SeedDetailPage({ params }: { params: { username: string; seedValue: string } }) {
  // 現在のユーザーを取得
  let currentUser = null
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (accessToken) {
      currentUser = await resolveCurrentUser(accessToken)
    }
  } catch (err) {
    // silently fail
  }

  const seed = await prisma.seed.findFirst({
    where: {
      seedValue: params.seedValue,
      author: { username: params.username.toLowerCase() }
    },
    include: {
      author: {
        select: {
          username: true,
          avatarUrl: true,
          speedrunId: true,
          pbTime: true,
          bio: true,
          _count: { select: { seeds: true, followers: true } }
        }
      },
      _count: { select: { likes: true, favorites: true } }
    }
  })

  if (!seed) {
    return (
      <SiteShell title="シード詳細" subtitle="該当するシードが見つかりませんでした。" icon="fa-seedling">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-600">URL を確認するか、検索ページから再度探してください。</p>
        </div>
      </SiteShell>
    )
  }

  const relatedSeeds = await prisma.seed.findMany({
    where: {
      seedValue: seed.seedValue,
      id: { not: seed.id }
    },
    include: {
      author: { select: { username: true, avatarUrl: true } },
      _count: { select: { likes: true, favorites: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  })

  // 現在ユーザーのいいね・お気に入り状態を取得
  let liked = false
  let favorited = false
  if (currentUser) {
    const like = await prisma.like.findUnique({ where: { userUsername_seedId: { userUsername: currentUser.username, seedId: seed.id } } }).catch(() => null)
    const fav = await prisma.favorite.findUnique({ where: { userUsername_seedId: { userUsername: currentUser.username, seedId: seed.id } } }).catch(() => null)
    liked = !!like
    favorited = !!fav
  }

  return (
    <SiteShell
      title={params.seedValue}
      subtitle="投稿内容、同じ seed の別投稿、投稿者情報をまとめて確認できます。"
      icon="fa-list-ul"
    >
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <section className="space-y-5 lg:col-span-8">
          <SeedCard
            seed={seed}
            showAuthor={false}
            initialLiked={liked}
            initialFavorited={favorited}
            actionSlot={
              <ReportButton
                targetType="seed"
                targetSeedId={seed.id}
                targetSeedValue={seed.seedValue}
                targetAuthorUsername={seed.author.username}
              />
            }
          />

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">同じ seed 値の他の投稿</h3>
                <p className="mt-1 text-sm text-slate-500">別の投稿者による評価やコメントを見比べられます。</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {relatedSeeds.length} 件
              </span>
            </div>
            <div className="mt-4">
              {relatedSeeds.length === 0 ? (
                <div className="md:col-span-2 rounded-xl border border-dashed bg-slate-50 p-6 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                      <i className="fa-solid fa-layer-group" aria-hidden />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800">同じ seed 値の別投稿はまだありません。</div>
                      <p className="mt-1 leading-6">この seed の見どころを知っている人が投稿すると、ここに追加されます。</p>
                    </div>
                  </div>
                </div>
              ) : (
                <SeedGrid
                  seeds={relatedSeeds}
                  layout="row"
                />
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:col-span-4">
          <SeedActionButtons
            seedId={seed.id}
            username={seed.author.username}
            seedValue={seed.seedValue}
            authorUsername={seed.author.username}
            currentUserUsername={currentUser?.username}
          />

          <div className="rounded-xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <i className="fa-solid fa-user" aria-hidden />
              投稿者
            </div>
            <div className="mt-4 flex items-start gap-4">
              <Link
                href={`/users/${seed.author.username}`}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xl font-bold text-white"
              >
                {seed.author.avatarUrl ? (
                  <img src={seed.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  seed.author.username.charAt(0).toUpperCase()
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/users/${seed.author.username}`} className="font-semibold text-lg text-slate-900 hover:text-primary-600">
                  @{seed.author.username}
                </Link>
                <p className="mt-1 line-clamp-3 break-words leading-relaxed text-slate-500">
                  {seed.author.bio || '自己紹介は未設定です。'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">投稿数</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{seed.author._count.seeds}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs text-slate-500">フォロワー</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{seed.author._count.followers}</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-primary-50/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <i className="fa-solid fa-stopwatch" aria-hidden />
                投稿者PB
              </div>
              <p className="mt-2">
                {seed.author.pbTime ? (
                  <>
                    <span className="font-semibold text-lg text-primary-600">{formatTime(seed.author.pbTime)}</span>
                  </>
                ) : seed.author.speedrunId ? (
                  <>
                    <span className="text-slate-600">Speedrun.com ID: {seed.author.speedrunId}</span>
                    <span className="block text-xs text-slate-500 mt-1">PB情報は次回の同期で更新されます</span>
                  </>
                ) : (
                  'PB はまだ登録されていません。'
                )}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {currentUser?.username === seed.author.username ? (
                <Link href="/settings" className="btn bg-amber-500 text-white hover:bg-amber-600 text-sm">
                  <i className="fa-solid fa-pen-to-square mr-2" aria-hidden />プロフィールを編集
                </Link>
              ) : (
                <FollowButton username={seed.author.username} />
              )}
            </div>
          </div>

        </aside>
      </div>
    </SiteShell>
  )
}
