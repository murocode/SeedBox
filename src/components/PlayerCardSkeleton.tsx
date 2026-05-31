"use client"

import React from 'react'

export default function PlayerCardSkeleton() {
  return (
    <article className="bg-white rounded-xl shadow-sm border p-3 animate-pulse" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-16 rounded bg-slate-200" />
      </div>
    </article>
  )
}
