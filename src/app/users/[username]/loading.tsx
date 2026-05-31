import SiteShell from '../../../components/SiteShell'

export default function Loading() {
  return (
    <SiteShell title="ユーザーページ" subtitle="読み込み中..." icon="fa-user">
      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-32 rounded-full bg-slate-200" />
                <div className="h-4 w-full rounded-full bg-slate-200" />
                <div className="h-4 w-5/6 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-slate-50 p-3">
              <div className="h-16 rounded-xl bg-slate-200" />
              <div className="h-16 rounded-xl bg-slate-200" />
            </div>
            <div className="h-20 rounded-xl bg-slate-200" />
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3 animate-pulse">
                <div className="h-40 rounded-xl bg-slate-200" />
                <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="h-4 w-1/2 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}