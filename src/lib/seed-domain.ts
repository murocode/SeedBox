export type EaseValue = 'EASY' | 'NORMAL' | 'HARD'
export type DistanceValue = 'NEAR' | 'NORMAL' | 'FAR'
export type PortalEaseValue = 'EASY' | 'HARD'
export type ZeroCycleValue = 'EASY' | 'HARD'

export const EASE_LABELS: Record<EaseValue, string> = {
  EASY: '走りやすい',
  NORMAL: '普通',
  HARD: '走りにくい'
}

export const DISTANCE_LABELS: Record<DistanceValue, string> = {
  NEAR: '近い',
  NORMAL: '普通',
  FAR: '遠い'
}

export const PORTAL_EASE_LABELS: Record<PortalEaseValue, string> = {
  EASY: '見つけやすい',
  HARD: '見つけにくい'
}

export const ZERO_CYCLE_LABELS: Record<ZeroCycleValue, string> = {
  EASY: '簡単',
  HARD: '難しい'
}

export function parseCsvList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  return value.split(',').map(item => item.trim()).filter(Boolean)
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  return ['true', '1', 'あり', 'yes'].includes(String(value).toLowerCase())
}

export function normalizeEase(value: unknown): EaseValue | undefined {
  if (typeof value !== 'string' || !value) return undefined
  if (value === 'EASY' || value === '走りやすい') return 'EASY'
  if (value === 'NORMAL' || value === '普通') return 'NORMAL'
  if (value === 'HARD' || value === '走りにくい') return 'HARD'
  return undefined
}

export function normalizeDistance(value: unknown): DistanceValue | undefined {
  if (typeof value !== 'string' || !value) return undefined
  if (value === 'NEAR' || value === '近い') return 'NEAR'
  if (value === 'NORMAL' || value === '普通') return 'NORMAL'
  if (value === 'FAR' || value === '遠い') return 'FAR'
  return undefined
}

export function normalizePortalEase(value: unknown): PortalEaseValue | undefined {
  if (typeof value !== 'string' || !value) return undefined
  if (value === 'EASY' || value === '見つけやすい') return 'EASY'
  if (value === 'HARD' || value === '見つけにくい') return 'HARD'
  return undefined
}

export function normalizeZeroCycle(value: unknown): ZeroCycleValue | undefined {
  if (typeof value !== 'string' || !value) return undefined
  if (value === 'EASY' || value === '簡単') return 'EASY'
  if (value === 'HARD' || value === '難しい') return 'HARD'
  return undefined
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '投稿日時不明'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '投稿日時不明'
  return date.toLocaleDateString('ja-JP')
}

export function compactNumber(value?: number | null) {
  if (typeof value !== 'number') return '0'
  return value.toLocaleString('ja-JP')
}

export function buildUniqueUsername(base: string, suffixLength = 6) {
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 20) || 'user'

  const suffix = Math.random().toString(36).slice(2, 2 + suffixLength).toUpperCase()
  return `${normalized}-${suffix}`
}
