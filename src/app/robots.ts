import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seedbox.example.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/login',
          '/settings',
          '/favorites',
          '/seeds/new',
          '/seeds/*/edit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
