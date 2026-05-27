import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''

    if (!normalizedUsername) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(
        `https://www.speedrun.com/api/v1/users?lookup=${encodeURIComponent(normalizedUsername)}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        return NextResponse.json(
          { error: 'SPEEDRUN_API_ERROR' },
          { status: 502 }
        )
      }

      const data = await response.json().catch(() => ({ data: [] }))
      const exists = Array.isArray(data?.data) && data.data.length > 0

      return NextResponse.json({ exists })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'SPEEDRUN_API_TIMEOUT' },
        { status: 504 }
      )
    }

    console.error('Check speedrun user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
