/**
 * URL バリデーション関数
 */
export function validateUrl(url: string | null | undefined): boolean {
  if (!url) return true // optional fields

  if (typeof url !== 'string') return false

  try {
    const parsed = new URL(url)
    // https のみを許可
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Seed値バリデーション
 */
export function validateSeedValue(seedValue: unknown): boolean {
  if (typeof seedValue !== 'string' || !/^-?\d+$/.test(seedValue.trim())) {
    return false
  }

  try {
    const value = BigInt(seedValue.trim())
    const min = BigInt('-9223372036854775808')
    const max = BigInt('9223372036854775807')
    return value >= min && value <= max
  } catch {
    return false
  }
}

/**
 * ユーザー名バリデーション
 */
export function validateUsername(username: unknown): boolean {
  if (typeof username !== 'string') return false

  // 英数字、アンダースコア、ハイフン、3-32文字
  const pattern = /^[a-zA-Z0-9_-]{3,32}$/
  return pattern.test(username)
}

/**
 * コメントバリデーション
 */
export function validateComment(comment: unknown): boolean {
  if (!comment) return true // optional

  if (typeof comment !== 'string') return false

  // 1000文字以内
  return comment.length <= 1000
}

/**
 * バイオバリデーション
 */
export function validateBio(bio: unknown): boolean {
  if (!bio) return true // optional

  if (typeof bio !== 'string') return false

  // 500文字以内
  return bio.length <= 500
}
