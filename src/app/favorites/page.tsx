import SiteShell from '../../components/SiteShell'
import { cookies } from 'next/headers'
import { prisma } from '../../lib/prisma'
import { resolveCurrentUser } from '../../lib/auth'
import SeedCard from '../../components/SeedCard'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return (
      <SiteShell title="お気に入り" subtitle="お気に入りに登録したシード一覧" icon="fa-star">
        <div className="rounded-2xl bg-white border shadow-sm p-6 text-sm text-slate-700">
          ログインするとお気に入りを表示できます。<br />
          <a href="/login" className="text-primary-600 font-medium">ログインはこちら</a>
        </div>
      </SiteShell>
    )
  }

  const currentUser = await resolveCurrentUser(accessToken)
  if (!currentUser) {
    return (
      <SiteShell title="お気に入り" subtitle="お気に入りに登録したシード一覧" icon="fa-star">
        <div className="rounded-2xl bg-white border shadow-sm p-6 text-sm text-slate-700">ユーザーが見つかりません。再度ログインしてください。</div>
      </SiteShell>
    )
  }

  const favs = await prisma.favorite.findMany({
    where: { userUsername: currentUser.username },
    orderBy: { createdAt: 'desc' },
    include: {
      seed: {
        include: {
          author: { select: { username: true, avatarUrl: true, speedrunId: true } },
          _count: { select: { likes: true, favorites: true } }
        }
      }
    }
  })

  const seeds = favs.map(f => f.seed)
  let likedSet = new Set<number>()

  if (seeds.length > 0) {
    const seedIds = seeds.map(seed => seed.id)
    const userLikes = await prisma.like.findMany({
      where: { userUsername: currentUser.username, seedId: { in: seedIds } },
      select: { seedId: true }
    })
    userLikes.forEach(like => likedSet.add(like.seedId))
  }

  return (
    <SiteShell title="お気に入り" subtitle="お気に入りに登録したシード一覧" icon="fa-star">
      <div className="space-y-6">
        {seeds.length === 0 ? (
          <div className="rounded-2xl bg-white border shadow-sm p-6 text-sm text-slate-700">お気に入りに登録されたシードがありません。</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seeds.map(seed => (
              <SeedCard
                key={seed.id}
                seed={seed as any}
                initialLiked={likedSet.has(seed.id)}
                initialFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
