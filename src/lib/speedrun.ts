/**
 * Speedrun.com API integration for fetching PB times
 */

interface SpeedrunUserSummary {
  id: string
  names?: {
    international?: string | null
  }
}

interface SpeedrunUserLookupResponse {
  data: SpeedrunUserSummary[]
}

interface SpeedrunPersonalBestRun {
  category: string
  values?: Record<string, string>
  times: {
    primary_t: number
  }
}

interface SpeedrunPersonalBestEntry {
  place: number
  run: SpeedrunPersonalBestRun
}

interface SpeedrunPersonalBestResponse {
  data: SpeedrunPersonalBestEntry[]
}

const TARGET_CATEGORY_ID = 'mkeyl926'
const TARGET_VALUES = {
  'r8rg67rn': '21d4zvp1',
  'wl33kewl': '4qye4731'
} as const

async function resolveSpeedrunUserId(speedrunUserIdentifier: string): Promise<string | null> {
  const lookupResponse = await fetch(
    `https://www.speedrun.com/api/v1/users?lookup=${encodeURIComponent(speedrunUserIdentifier)}`,
    { signal: AbortSignal.timeout(5000) }
  )

  if (lookupResponse.ok) {
    const lookupData = (await lookupResponse.json()) as SpeedrunUserLookupResponse
    const lookupUserId = lookupData.data?.[0]?.id

    if (lookupUserId) {
      return lookupUserId
    }
  }

  const directResponse = await fetch(
    `https://www.speedrun.com/api/v1/users/${encodeURIComponent(speedrunUserIdentifier)}`,
    { signal: AbortSignal.timeout(5000) }
  )

  if (!directResponse.ok) {
    return null
  }

  const directData = await directResponse.json().catch(() => null) as { data?: { id?: string } } | null
  return directData?.data?.id ?? null
}

/**
 * Fetch PB time from Speedrun.com for Minecraft Java Any% Glitchless
 * Random Seed, 1.16-1.19 category
 * Returns time in seconds or null if not found
 */
export async function fetchSpeedrunPB(speedrunUserId: string): Promise<number | null> {
  try {
    const resolvedUserId = await resolveSpeedrunUserId(speedrunUserId)

    if (!resolvedUserId) {
      return null
    }

    // Speedrun.com API: Get personal bests for specific user
    // Game ID for Minecraft: j1npme6p
    // Category Any% Glitchless: mkeyl926
    // Seed Type (Any% Glitchless) -> Random Seed: 21d4zvp1
    // Version Range (Any% Glitchless) -> 1.16-1.19: 4qye4731

    const response = await fetch(
      `https://www.speedrun.com/api/v1/users/${encodeURIComponent(resolvedUserId)}/personal-bests?game=j1npme6p&category=mkeyl926&var-r8rg67rn=21d4zvp1&var-wl33kewl=4qye4731`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      console.error(`Speedrun.com API error: ${response.status}`)
      return null
    }

    const data = (await response.json()) as SpeedrunPersonalBestResponse

    if (!data.data || data.data.length === 0) {
      return null
    }

    const bestEntry =
      data.data.find(entry =>
        entry.run?.category === TARGET_CATEGORY_ID &&
        entry.run?.values?.r8rg67rn === TARGET_VALUES.r8rg67rn &&
        entry.run?.values?.wl33kewl === TARGET_VALUES.wl33kewl
      ) ?? data.data.find(entry => entry.run?.category === TARGET_CATEGORY_ID) ?? data.data[0]
    return bestEntry?.run?.times.primary_t ?? null
  } catch (error) {
    console.error('Failed to fetch Speedrun.com PB:', error)
    return null
  }
}

/**
 * Fetch speedrun.com username (display name) for a given user ID
 */
export async function fetchSpeedrunUsername(speedrunUserId: string): Promise<string | null> {
  try {
    const resolvedUserId = await resolveSpeedrunUserId(speedrunUserId)

    if (!resolvedUserId) {
      return null
    }

    const response = await fetch(`https://www.speedrun.com/api/v1/users/${encodeURIComponent(resolvedUserId)}`, { signal: AbortSignal.timeout(5000) })

    if (!response.ok) {
      console.error(`Speedrun.com user API error: ${response.status}`)
      return null
    }

    const json = await response.json()
    // API returns user object with "names" field
    const name = json?.data?.names?.international ?? json?.data?.name ?? null
    return name ?? null
  } catch (error) {
    console.error('Failed to fetch Speedrun.com username:', error)
    return null
  }
}

/**
 * Convert seconds to time string with millisecond precision.
 */
export function formatTime(seconds: number): string {
  const totalMilliseconds = Math.round(seconds * 1000)
  const hours = Math.floor(totalMilliseconds / 3_600_000)
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000)
  const remainingSeconds = Math.floor((totalMilliseconds % 60_000) / 1000)
  const milliseconds = totalMilliseconds % 1000

  const formattedMilliseconds = String(milliseconds).padStart(3, '0')

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}.${formattedMilliseconds}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}.${formattedMilliseconds}`
}
