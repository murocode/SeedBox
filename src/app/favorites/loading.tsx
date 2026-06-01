import SiteShell from '../../components/SiteShell'
import SeedGridSkeleton from '../../components/SeedGridSkeleton'

export default function Loading() {
  return (
    <SiteShell title="お気に入り" subtitle="お気に入りに登録したシード一覧" icon="fa-star">
      <div className="space-y-6" aria-busy="true">
        <section>
          <SeedGridSkeleton count={8} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4" />
        </section>

        <section className="flex items-center justify-center gap-3">
          <div className="h-6 w-6 rounded-md bg-slate-200 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-6 w-6 rounded-md bg-slate-200 animate-pulse" />
        </section>
      </div>
    </SiteShell>
  )
}