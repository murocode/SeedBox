import '../styles/globals.css'
import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: import('next').Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com'),
  title: {
    default: 'SeedBox',
    template: '%s | SeedBox',
  },
  description: 'Minecraft Java Edition 1.16.1 スピードラン向けシードデータベース。地形・構造物・ネザーの条件で絞り込み、自分の練習に合ったシードを探せます。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'SeedBox',
    title: 'SeedBox',
    description: 'Minecraft Java Edition 1.16.1 スピードラン向けシードデータベース。地形・構造物・ネザーの条件で絞り込み、自分の練習に合ったシードを探せます。',
    images: [
      {
        url: '/seedbox-logo.png',
        width: 1200,
        height: 630,
        alt: 'SeedBox ロゴ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SeedBox',
    description: 'Minecraft Java Edition 1.16.1 スピードラン向けシードデータベース。',
    images: ['/seedbox-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* フォントと FontAwesome をクライアント側で非同期ロードするスクリプト。
            Server Component ではイベントハンドラを渡せないため、ここで DOM 操作します。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
;(function(){
  try {
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap';
    f.media = 'print';
    f.onload = function(){ f.media = 'all'; };
    document.head.appendChild(f);

    var fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css';
    fa.media = 'print';
    fa.onload = function(){ fa.media = 'all'; };
    document.head.appendChild(fa);
  } catch(e) { console.error('async style load failed', e); }
})();
            `,
          }}
        />
        <noscript>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
        </noscript>
        {/* Favicon */}
        <link rel="icon" href="/seedbox-logo.png" />
        {/* JSON-LD 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'SeedBox',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com',
              description: 'Minecraft Java Edition 1.16.1 スピードラン向けシードデータベース。地形・構造物・ネザーの条件で絞り込み、自分の練習に合ったシードを探せます。',
              inLanguage: 'ja',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com'}/seeds?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        {children}
        {/* SpeedInsights は本番で自動的に有効にすると追加リソースで FCP を悪化させるため、
            必要なら環境変数 NEXT_PUBLIC_SHOW_SPEED_INSIGHTS=1 を設定して表示してください */}
        {process.env.NEXT_PUBLIC_SHOW_SPEED_INSIGHTS === '1' && <SpeedInsights />}
      </body>
    </html>
  )
}
