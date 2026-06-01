import SiteShell from '../../components/SiteShell'

export default function Loading() {
  return (
    <SiteShell title="お気に入り" subtitle="お気に入りに登録したシード一覧" icon="fa-star">
      <div className="space-y-6" aria-busy="true">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-8 w-[min(22rem,100%)] rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-4 w-[min(28rem,100%)] rounded-xl bg-slate-200 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-slate-200 animate-pulse" />
              <div className="h-4 w-20 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-9 w-9 rounded-md bg-slate-200 animate-pulse" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="h-44 bg-slate-200 animate-pulse" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-5/6 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-3 w-20 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-7 w-16 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="flex items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-200 animate-pulse" />
          <div className="h-4 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-slate-200 animate-pulse" />
        </section>
      </div>
    </SiteShell>
  )
}