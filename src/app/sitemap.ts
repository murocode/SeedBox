import { MetadataRoute } from 'next'

export const revalidate = 3600 // 1時間ごとに再生成

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com'

  // 静的ページ
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/seeds`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/users`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // 動的ページ（シード詳細）の追加は Prisma が利用可能な場合のみ
  let dynamicRoutes: MetadataRoute.Sitemap = []
  try {
    const { prisma } = await import('../lib/prisma')

    // 最新100件のシード詳細ページ
    const seeds = await prisma.seed.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        seedValue: true,
        updatedAt: true,
        author: { select: { username: true } },
      },
    })

    dynamicRoutes = seeds.map((seed: { seedValue: string; updatedAt: Date; author: { username: string } }) => ({
      url: `${baseUrl}/seeds/${seed.author.username}/${seed.seedValue}`,
      lastModified: seed.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // 公開ユーザーページ
    const users = await prisma.user.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      select: { username: true, updatedAt: true },
    })

    const userRoutes: MetadataRoute.Sitemap = users.map((user: { username: string; updatedAt: Date }) => ({
      url: `${baseUrl}/users/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    dynamicRoutes = [...dynamicRoutes, ...userRoutes]
  } catch (e) {
    // DB接続不可の場合は静的ページのみ
    console.warn('sitemap: DB fetch skipped', e)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
