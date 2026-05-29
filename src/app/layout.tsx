import '../styles/globals.css'
import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: 'SeedBox for MinecraftRSG',
  description: 'Minecraft Java Edition 1.16.1 RSG シードデータベース'
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
