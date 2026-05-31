import SiteShell from '../components/SiteShell'

export default function Loading() {
  return (
    <SiteShell layout="hero" title="自分に合わせた練習を。" subtitle="SeedBoxは自分の苦手な地形を練習するのに役立つサービスです。">
      <>
        <section className="mb-8 rounded-2xl border bg-gradient-to-br from-white via-white to-primary-50 p-6 shadow-lg md:p-8">
          <div className="md:flex md:items-center md:justify-between md:gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-10 w-[min(22rem,100%)] rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-5 w-[min(36rem,100%)] rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-10 w-36 rounded-full bg-slate-200 animate-pulse" />
            </div>
            <div className="mt-6 md:mt-0 md:w-96 lg:w-[400px] space-y-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="h-3 w-20 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-3 h-8 w-24 rounded-xl bg-slate-200 animate-pulse" />
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="h-3 w-20 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-3 h-8 w-24 rounded-xl bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div className="h-6 w-48 rounded-full bg-slate-200 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3 animate-pulse">
                <div className="h-40 rounded-xl bg-slate-200" />
                <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="h-4 w-1/2 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div className="h-6 w-56 rounded-full bg-slate-200 animate-pulse" />
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
            <div className="mt-3 h-4 w-4/5 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </section>
      </>
    </SiteShell>
  )
}