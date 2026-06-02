import { PrismaClient } from '@prisma/client'
import dns from 'dns'

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function getPrismaDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return undefined
  }

  const url = new URL(databaseUrl)
  const hostname = url.hostname.toLowerCase()
  const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(hostname)
  const isSupabasePooler =
    hostname.includes('pooler.supabase.com') || url.port === '6543' || url.searchParams.get('pgbouncer') === 'true'

  if (!isLocalDatabase && !url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '5')
  }

  if (isSupabasePooler) {
    if (url.port !== '6543') {
      url.port = '6543'
    }

    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
  }

  return url.toString()
}

const prismaDatabaseUrl = getPrismaDatabaseUrl()
export const prisma = globalThis.prisma ?? new PrismaClient(
  prismaDatabaseUrl
    ? {
        datasources: {
          db: {
            url: prismaDatabaseUrl
          }
        }
      }
    : undefined
)

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
