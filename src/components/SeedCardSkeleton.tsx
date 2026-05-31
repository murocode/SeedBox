"use client"

import React from 'react'

export default function SeedCardSkeleton() {
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-xl border bg-white shadow-lg animate-pulse" aria-busy="true">
      <div className="p-4">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-slate-200 mb-2" />
              <div className="h-3 w-20 rounded bg-slate-200" />
            </div>
          </div>

          <div className="w-full min-w-0 mt-2">
            <div className="space-y-3">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="space-y-2 mt-2">
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-11/12 rounded bg-slate-200" />
                <div className="h-3 w-8/12 rounded bg-slate-200" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="h-6 w-14 rounded-full bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-6 w-10 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t bg-gradient-to-t from-white/60 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-6 w-16 rounded bg-slate-200" />
        </div>
      </div>
    </article>
  )
}
