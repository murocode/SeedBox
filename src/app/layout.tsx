import '../styles/globals.css'
import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter } from 'next/font/google'

export const metadata = {
  title: 'SeedBox for MinecraftRSG',
  description: 'Minecraft Java Edition 1.16.1 RSG シードデータベース'
}

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Font Awesome (CDN) - アイコン表示用 */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />

        {/* Favicon */}
        <link rel="icon" href="/seedbox-logo.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
