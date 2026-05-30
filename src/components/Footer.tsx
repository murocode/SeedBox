'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SupportModal, { SUPPORT_CATEGORY_OPTIONS, type SupportCategory } from './SupportModal'
import CreditsModal from './CreditsModal'

const FOOTER_LINKS = [
  {
    href: '#feedback',
    label: 'お問い合わせ',
    icon: 'fa-regular fa-message'
  },
  {
    href: 'https://github.com/murocode/SeedBox',
    label: 'GitHub',
    icon: 'fa-brands fa-github',
    external: true
  },
  {
    href: 'https://ofuse.me/mur0hi',
    label: '寄付',
    icon: 'fa-regular fa-heart',
    external: true
  }
]

export default function Footer() {
  const [modalOpen, setModalOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [category, setCategory] = useState<SupportCategory>('CONTACT')

  function openSupportModal(nextCategory: SupportCategory) {
    setCategory(nextCategory)
    setModalOpen(true)
  }

  return (
    <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-sm text-slate-700">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
                <Image src="/seedbox-logo-black.webp" alt="SeedBox" width={56} height={56} className="h-12 w-auto max-w-full object-contain sm:h-14" loading="lazy" />
            <span className="text-xs font-medium text-slate-500">by mur0hi</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => openSupportModal('CONTACT')}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary-600"
            >
              <i className="fa-regular fa-message text-[0.85em]" aria-hidden />
              <span className="text-xs">お問い合わせ</span>
            </button>

            <button
              type="button"
              onClick={() => setCreditsOpen(true)}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary-600"
            >
              <i className="fa-regular fa-circle-user text-[0.85em]" aria-hidden />
              <span className="text-xs">クレジット</span>
            </button>

            {FOOTER_LINKS.slice(1).map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 transition-colors hover:text-primary-600"
              >
                <i className={`${item.icon} text-[0.85em]`} aria-hidden />
                <span className="text-xs">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <SupportModal open={modalOpen} initialCategory={category} onClose={() => setModalOpen(false)} />
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </footer>
  )
}
