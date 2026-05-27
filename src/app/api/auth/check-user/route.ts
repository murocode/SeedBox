import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

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
