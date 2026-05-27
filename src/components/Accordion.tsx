'use client'

import React, { useState } from 'react'

interface AccordionItemProps {
  id: string
  title: string
  badge?: number | string
  children: React.ReactNode
  defaultOpen?: boolean
}

interface AccordionProps {
  items: AccordionItemProps[]
}

function AccordionItem({ id, title, badge, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {badge !== undefined && badge !== 0 && (
          <span className="inline-block bg-primary-600 text-white text-xs font-semibold rounded-full px-2 py-1">
            {badge}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-slate-50 space-y-3 border-t">
          {children}
        </div>
      )}
    </div>
  )
}

export default function Accordion({ items }: AccordionProps) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {items.map((item) => (
        <AccordionItem key={item.id} {...item} />
      ))}
    </div>
  )
}
