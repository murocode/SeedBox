"use client"

import React from 'react'
import SeedCard from './SeedCard'
import HorizontalScroller from './HorizontalScroller'

type Props = {
  seeds: any[]
  className?: string
  layout?: 'grid' | 'row'
}

export default function SeedGrid({ seeds, className, layout = 'grid' }: Props) {
  const gridClass = className ?? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  if (layout === 'row') {
    return (
      <HorizontalScroller
        items={seeds.map(seed => (
          <SeedCard seed={seed} />
        ))}
      />
    )
  }

  return (
    <div className={gridClass}>
      {seeds.map(seed => {
        return <SeedCard key={seed.id} seed={seed} />
      })}
    </div>
  )
}
