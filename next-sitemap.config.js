/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/auth',
          '/login',
          '/settings',
          '/favorites',
        ],
      },
    ],
  },
  // 動的ルートは除外し、静的ルートのみ生成
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/login',
    '/settings',
    '/favorites',
    '/seeds/*/edit',
    '/seeds/new',
  ],
  // サイトマップは next build 後に生成される
  outDir: './public',
}
