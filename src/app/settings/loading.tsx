import SiteShellClient from '../../components/SiteShellClient'

export default function Loading() {
  return (
    <SiteShellClient title="設定" subtitle="読み込み中..." icon="fa-gear">
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-4">
          <div className="h-6 w-32 rounded-full bg-slate-200" />
          <div className="h-4 w-64 rounded-full bg-slate-200" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="h-24 w-full rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-4">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-4">
          <div className="h-6 w-44 rounded-full bg-slate-200" />
          <div className="grid gap-3">
            <div className="h-16 rounded-xl bg-slate-200" />
            <div className="h-16 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </SiteShellClient>
  )
}