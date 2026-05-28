import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../../../lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seedId: string }> }
) {
  try {
    const { seedId } = await params
    const seedIdNumber = parseInt(seedId)
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const seed = await prisma.seed.findUnique({ where: { id: seedIdNumber } })
    if (!seed) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // 既に存在するかチェック
    const existingLike = await prisma.like.findUnique({
      where: {
        userUsername_seedId: { userUsername: currentUser.username, seedId: seedIdNumber }
      }
    })

    if (existingLike) {
      return NextResponse.json({ error: 'ALREADY_LIKED' }, { status: 409 })
    }

    await prisma.like.create({
      data: { userUsername: currentUser.username, seedId: seedIdNumber }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seedId: string }> }
) {
  try {
    const { seedId } = await params
    const seedIdNumber = parseInt(seedId)
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    await prisma.like.deleteMany({
      where: { userUsername: currentUser.username, seedId: seedIdNumber }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
