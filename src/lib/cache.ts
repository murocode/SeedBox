let memCache = new Map<string, { value: string; expireAt: number }>()

async function getRedisClient() {
  if (!process.env.REDIS_URL) return null
  // cache client on globalThis to avoid reconnect storms
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (globalThis.__redis) return globalThis.__redis

  try {
    // dynamic import so project doesn't hard-depend on redis in dev
    const IORedis = await import('ioredis')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const client = new IORedis.default(process.env.REDIS_URL)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.__redis = client
    return client
  } catch (err) {
    // ioredis not installed or failed — fall back to memory cache
    // eslint-disable-next-line no-console
    console.warn('[cache] redis unavailable, falling back to memory cache')
    return null
  }
}

export async function cacheGet(key: string) {
  const client = await getRedisClient()
  if (client) {
    try {
      const raw = await client.get(key)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (err) {
      return null
    }
  }

  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expireAt) {
    memCache.delete(key)
    return null
  }
  try {
    return JSON.parse(entry.value)
  } catch {
    memCache.delete(key)
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 30) {
  const client = await getRedisClient()
  const str = JSON.stringify(value)
  if (client) {
    try {
      await client.set(key, str, 'EX', Math.max(1, Math.floor(ttlSeconds)))
      return
    } catch (err) {
      // fallthrough to mem cache
    }
  }

  memCache.set(key, { value: str, expireAt: Date.now() + ttlSeconds * 1000 })
}

export function cacheClearAllForPrefix(prefix: string) {
  // Simple in-memory invalidation helper — only affects memCache
  for (const k of Array.from(memCache.keys())) {
    if (k.startsWith(prefix)) memCache.delete(k)
  }
}

export default {
  cacheGet,
  cacheSet,
  cacheClearAllForPrefix
}
