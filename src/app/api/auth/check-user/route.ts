import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, normalizeEmail } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const user = await findUserByEmail(normalizedEmail)

    // only expose existence flag to clients; do not return internal IDs
    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error('Check user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
