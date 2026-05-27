"use client"

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  items: React.ReactNode[]
  itemClassName?: string
  className?: string
}

export default function HorizontalScroller({ items, itemClassName = 'w-[calc(100vw-5rem)] max-w-[300px] shrink-0 snap-start sm:w-[320px] sm:max-w-none', className }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const updateScrollState = () => {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [items.length])

  function scrollByCards(direction: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return

    const amount = Math.max(280, Math.min(el.clientWidth * 0.8, 520))
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className={className ?? 'relative'}>
      <button
        type="button"
        onClick={() => scrollByCards('left')}
        disabled={!canScrollLeft}
        aria-label="左へスクロール"
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-lg text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <i className="fa-solid fa-chevron-left" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => scrollByCards('right')}
        disabled={!canScrollRight}
        aria-label="右へスクロール"
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-lg text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <i className="fa-solid fa-chevron-right" aria-hidden />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 pr-4 sm:pl-12 sm:pr-12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
