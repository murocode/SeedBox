import React from 'react'

export default function PageHeader({
  title,
  subtitle,
  icon = 'fa-circle-info',
  rightSlot
}: {
  title: string
  subtitle?: string
  icon?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm">
              <i className={`fa-solid ${icon} text-base`} aria-hidden />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          </div>
          {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className="md:flex-none md:w-96 lg:w-[400px]">{rightSlot}</div> : null}
      </div>
    </section>
  )
}