import { prisma } from '../lib/prisma'
import SiteShell from '../components/SiteShell'
import SeedGrid from '../components/SeedGrid'
import PlayerRow from '../components/PlayerRow'

// 公開データは ISR を使ってキャッシュして FCP を改善する
export const revalidate = 60

export default async function Home() {
  let seedCount: number | null = null
  let userCount: number | null = null
  let latestSeeds: any[] = []
  let followingFeedSeeds: any[] = []
  let currentUser: any = null
  let nearbyPlayers: any[] = []

  try {
    const [dbSeedCount, dbUserCount, dbLatestSeeds] = await Promise.all([
      prisma.seed.count(),
      prisma.user.count(),
      prisma.seed.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true, avatarUrl: true } },
          _count: { select: { likes: true, favorites: true } }
        }
      })
    ])

    seedCount = dbSeedCount
    userCount = dbUserCount
    latestSeeds = dbLatestSeeds

    // サーバー側ではパーソナライズを行わない（クッキー依存処理はクライアント側へ移す）
    nearbyPlayers = []
  } catch (error) {
    console.error('home data load failed', error)
  }

  return (
    <SiteShell
      layout="hero"
      title="自分に合わせた練習を。"
      subtitle="SeedBoxは自分の苦手な地形を練習するのに役立つサービスです。"
      heroActions={
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href="/seeds" className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition">シードを探そう</a>
        </div>
      }
      rightSlot={
        <div className="flex flex-col gap-3 text-sm">
          <div className="rounded-xl bg-white border p-3 shadow-sm w-full text-left">
            <div className="text-slate-400">シード数</div>
            <div className="text-2xl font-bold text-primary-600">
              {seedCount === null ? '取得できませんでした' : seedCount.toLocaleString('ja-JP')}
            </div>
          </div>
          <div className="rounded-xl bg-white border p-3 shadow-sm w-full text-left">
            <div className="text-slate-400">ユーザー数</div>
            <div className="text-2xl font-bold text-primary-600">
              {userCount === null ? '取得できませんでした' : userCount.toLocaleString('ja-JP')}
            </div>
          </div>
        </div>
      }
    >
      <>
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">最近投稿されたシード</h2>
          {latestSeeds.length ? (
            <SeedGrid
              seeds={latestSeeds}
              layout="row"
            />
          ) : (
            <div className="text-slate-500">まだシードがありません。</div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">タイム帯が近いプレイヤー</h2>
          {(!currentUser) ? (
            <div className="text-slate-500">ログインしていません。ログインすると近いタイム帯のプレイヤーを表示します。</div>
          ) : (!currentUser.speedrunId) ? (
            <div className="text-slate-500">Speedrun.comのユーザーIDが登録されていません。設定からIDを登録してください。</div>
          ) : (nearbyPlayers && nearbyPlayers.length > 0) ? (
            <PlayerRow players={nearbyPlayers as any} />
          ) : (
            <div className="text-slate-500">近いタイム帯のプレイヤーが見つかりませんでした。</div>
          )}
        </section>
      </>
    </SiteShell>
  )
}
