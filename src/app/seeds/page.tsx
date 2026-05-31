import React from 'react'
import SiteShell from '../../components/SiteShell'
import SeedSearchBoard from '../../components/SeedSearchBoard'
import SeedGridSkeleton from '../../components/SeedGridSkeleton'

export default function SeedsPage() {
  return (
    <SiteShell
      title="シード検索"
      subtitle="自分の練習したい地形のシード値を探してみましょう。"
      icon="fa-magnifying-glass"
    >
      <React.Suspense fallback={<div className="rounded-2xl bg-white border shadow-sm p-4"><SeedGridSkeleton count={6} /></div>}>
        <SeedSearchBoard />
      </React.Suspense>
    </SiteShell>
  )
}
