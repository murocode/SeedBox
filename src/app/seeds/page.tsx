import React from 'react'
import SiteShell from '../../components/SiteShell'
import SeedSearchBoard from '../../components/SeedSearchBoard'

export default function SeedsPage() {
  return (
    <SiteShell
      title="シード検索"
      subtitle="自分の練習したい地形のシード値を探してみましょう。"
      icon="fa-magnifying-glass"
    >
      <React.Suspense fallback={<div className="rounded-2xl bg-white border shadow-sm p-8 text-center text-slate-500">読み込み中...</div>}>
        <SeedSearchBoard />
      </React.Suspense>
    </SiteShell>
  )
}
