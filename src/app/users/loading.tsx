import SiteShell from '../../components/SiteShell'

export default function Loading() {
  return (
    <SiteShell title="ユーザー検索" subtitle="読み込み中..." icon="fa-users">
      <div className="space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4 animate-pulse">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="h-10 w-full rounded-xl bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-10 rounded-xl bg-slate-200" />
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
          <div className="h-4 w-3/4 rounded-full bg-slate-200" />
          <div className="flex gap-3">
            <div className="h-10 flex-1 rounded-xl bg-slate-200" />
            <div className="h-10 w-28 rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-40 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-9 w-48 rounded-full bg-slate-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3 animate-pulse">
              <div className="h-28 rounded-xl bg-slate-200" />
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}