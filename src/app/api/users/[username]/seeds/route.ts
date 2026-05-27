import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const seeds = await prisma.seed.findMany({
      where: { authorUsername: user.username },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true, avatarUrl: true, speedrunId: true } },
        _count: { select: { likes: true, favorites: true } }
      }
    })

    return NextResponse.json({ seeds })
  } catch (error) {
    console.error('Get user seeds error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
