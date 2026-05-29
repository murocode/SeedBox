"use client"
import React, { useEffect, useState } from 'react'
import Footer from './Footer'
import AccountMenu from './AccountMenu'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import SiteNavClient from './SiteNavClient'
import MobileNav from './MobileNav'
import PageHeader from './PageHeader'
import { supabase } from '../lib/supabaseClient'

type NavItem = { href: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'トップ' },
  { href: '/seeds', label: 'シード' },
  { href: '/users', label: 'ユーザー' }
]

export default function SiteShellClient({
  title,
  subtitle,
  children,
  rightSlot,
  icon,
  layout = 'page',
  currentUser
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  rightSlot?: React.ReactNode
  icon?: string
  layout?: 'page' | 'hero'
  currentUser?: { username: string; email?: string | null; avatarUrl?: string | null } | null
}) {
  const router = useRouter()
  const [mobileUser, setMobileUser] = useState(currentUser)

  useEffect(() => {
    if (currentUser !== undefined) {
      setMobileUser(currentUser)
      return
    }

    let active = true

    async function loadCurrentUser() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          if (active) {
            setMobileUser(null)
          }
          return
        }

        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          if (active) {
            setMobileUser(null)
          }
          return
        }

        const data = await response.json().catch(() => ({}))
        if (active) {
          setMobileUser(data.user ?? null)
        }
      } catch {
        if (active) {
          setMobileUser(null)
        }
      }
    }

    loadCurrentUser()

    return () => {
      active = false
    }
  }, [currentUser])

  const handlePostClick = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    router.push(sessionData.session ? '/seeds/new' : '/login')
  }

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
                <div className="text-sm text-slate-500">for Minecraft RSG</div>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            <SiteNavClient />
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handlePostClick} className="rounded-full bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700"><i className="fa-solid fa-plus mr-2" aria-hidden />投稿</button>
              <AccountMenu currentUser={currentUser} loadCurrentUser={currentUser === undefined} />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <MobileNav currentUser={mobileUser ? { username: mobileUser.username } : null} postHref={mobileUser ? '/seeds/new' : '/login'} />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8">
        {layout === 'hero' ? (
          <section className="mb-8 rounded-2xl border bg-gradient-to-br from-white via-white to-primary-50 p-6 shadow-lg md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-500">SeedBox</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
              {subtitle ? <p className="mt-3 leading-7 text-slate-600">{subtitle}</p> : null}
            </div>
            {rightSlot ? <div className="mt-6 md:mt-0">{rightSlot}</div> : null}
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
