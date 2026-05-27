import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; seedValue: string } }
) {
  try {
    const { username, seedValue } = params

    const seed = await prisma.seed.findFirst({
      where: {
        seedValue: seedValue.trim(),
        author: {
          username: username.toLowerCase()
        }
      },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            speedrunId: true
          }
        },
        likes: { select: { userUsername: true } },
        favorites: { select: { userUsername: true } },
        _count: { select: { likes: true, favorites: true } }
      }
    })

    if (!seed) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 同じseed値の他の投稿を取得
    const relatedSeeds = await prisma.seed.findMany({
      where: {
        seedValue: seedValue.trim(),
        id: { not: seed.id }
      },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true
          }
        },
        _count: { select: { likes: true, favorites: true } }
      },
      take: 5
    })

    // ログイン状態の確認
    let liked = false
    let favorited = false
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const accessToken = authHeader.replace(/^Bearer\s+/i, '')
      const currentUser = await resolveCurrentUser(accessToken)
      if (currentUser) {
        const like = await prisma.like.findUnique({ where: { userUsername_seedId: { userUsername: currentUser.username, seedId: seed.id } } }).catch(() => null)
        const fav = await prisma.favorite.findUnique({ where: { userUsername_seedId: { userUsername: currentUser.username, seedId: seed.id } } }).catch(() => null)
        liked = !!like
        favorited = !!fav
      }
    }

    return NextResponse.json({
      seed,
      relatedSeeds,
      liked,
      favorited
    })
  } catch (error) {
    console.error('Get seed detail error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
