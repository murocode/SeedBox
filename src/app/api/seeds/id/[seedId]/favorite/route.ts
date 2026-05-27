import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../../../lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { seedId: string } }
) {
  try {
    const seedId = parseInt(params.seedId)
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const seed = await prisma.seed.findUnique({ where: { id: seedId } })
    if (!seed) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // 既に存在するかチェック
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userUsername_seedId: { userUsername: currentUser.username, seedId }
      }
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'ALREADY_FAVORITED' }, { status: 409 })
    }

    await prisma.favorite.create({
      data: { userUsername: currentUser.username, seedId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorite error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { seedId: string } }
) {
  try {
    const seedId = parseInt(params.seedId)
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    await prisma.favorite.deleteMany({
      where: { userUsername: currentUser.username, seedId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfavorite error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
