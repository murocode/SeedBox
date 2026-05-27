"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'トップ' },
  { href: '/seeds', label: 'シード' },
  { href: '/users', label: 'ユーザー' }
]

function getIconForLabel(label: string) {
  switch (label) {
    case 'トップ':
      return <i className="fa-solid fa-house mr-2" aria-hidden />
    case 'シード':
      return <i className="fa-solid fa-magnifying-glass mr-2" aria-hidden />
    case 'ユーザー':
      return <i className="fa-solid fa-users mr-2" aria-hidden />
    default:
      return null
  }
}

export default function SiteNavClient() {
  const pathname = usePathname() || '/'

  return (
    <nav className="flex items-center gap-4 text-sm">
      {NAV_ITEMS.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const base = 'transition-colors'
        const activeClasses = 'bg-primary-50 text-primary-600 rounded-full px-3 py-2'
        const inactiveClasses = 'text-slate-600 hover:text-primary-600'

        return (
          <Link key={item.href} href={item.href} className={`${base} ${isActive ? activeClasses : inactiveClasses}`}>
            {getIconForLabel(item.label)}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
