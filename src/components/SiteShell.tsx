import React from 'react'
import Footer from './Footer'
import Link from 'next/link'
import Image from 'next/image'
import AccountMenu from './AccountMenu'
import SiteNavClient from './SiteNavClient'
import MobileNav from './MobileNav'
import PageHeader from './PageHeader'
import PostButton from './PostButton'

type NavItem = { href: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'トップ' },
  { href: '/seeds', label: 'シード' },
  { href: '/users', label: 'ユーザー' },
    // { href: '/seeds/new', label: '投稿作成' },
  // 管理画面は権限がある場合のみ表示するためここでは定義しない
]

export default async function SiteShell({
  title,
  subtitle,
  children,
  rightSlot,
  heroActions,
  icon,
  layout = 'page'
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  rightSlot?: React.ReactNode
  heroActions?: React.ReactNode
  icon?: string
  layout?: 'page' | 'hero'
}) {
  // Avoid resolving the current user on the server for every page render —
  // client-side `AccountMenu` will load user data when needed. This
  // significantly reduces server-side latency for public pages.
  const canModerate = false
  const currentUser = undefined

  return (
    <div className="flex min-h-screen flex-col">
      <header className="site-header sticky top-0 z-30 backdrop-blur bg-white/90">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/seedbox-logo-small.webp" alt="SeedBox" width={40} height={40} className="object-contain" priority />
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  Seed<span className="text-[#2d2d2d]">Box</span>
                </div>
                <div className="text-sm text-slate-500">for Minecraft Speedrunning</div>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            <SiteNavClient />
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            {canModerate ? (
              <a href="/admin" className="ml-4 hover:text-primary-600 transition-colors">管理画面</a>
            ) : null}
            <div className="flex items-center gap-3">
              <PostButton className="rounded-full bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700" />
              <AccountMenu loadCurrentUser={true} />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 overflow-x-clip px-4 py-8">
        {layout === 'hero' ? (
          <section className="mb-8 rounded-2xl border bg-gradient-to-br from-white via-white to-primary-50 p-6 shadow-lg md:p-8">
            <div className="md:flex md:items-center md:justify-between md:gap-6">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500">SeedBox</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-3 leading-7 text-slate-600">{subtitle}</p> : null}
                {heroActions ? <div className="mt-4">{heroActions}</div> : null}
              </div>
              {rightSlot ? <div className="mt-6 md:mt-0 md:flex-none md:w-96 lg:w-[400px]">{rightSlot}</div> : null}
            </div>
          </section>
        ) : (
          <PageHeader title={title} subtitle={subtitle} icon={icon} rightSlot={rightSlot} />
        )}
        {children}
      </main>

      <Footer />
    </div>
  )
}
