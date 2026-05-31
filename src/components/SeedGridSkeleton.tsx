"use client"

import React from 'react'
import SeedCardSkeleton from './SeedCardSkeleton'

type Props = {
  count?: number
  className?: string
  layout?: 'grid' | 'row'
}

export default function SeedGridSkeleton({ count = 6, className, layout = 'grid' }: Props) {
  const gridClass = className ?? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  if (layout === 'row') {
    return (
      <div className="flex gap-4 overflow-x-auto py-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-[240px] shrink-0">
            <SeedCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SeedCardSkeleton key={i} />
      ))}
    </div>
  )
}
