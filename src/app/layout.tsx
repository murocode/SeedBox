import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'SeedBox for MinecraftRSG',
  description: 'Minecraft Java Edition 1.16.1 RSG シードデータベ�Eス'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
        {/* Font Awesome (CDN) - アイコン表示用 */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
        {/* Favicon: place your PNG at public/favicon.png */}
        <link rel="icon" href="/seedbox-logo.png" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  )
}
