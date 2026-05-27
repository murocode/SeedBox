import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''

    if (!normalizedUsername) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // ユーザー名の重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'USERNAME_TAKEN' },
        { status: 409 }
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Check username error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
