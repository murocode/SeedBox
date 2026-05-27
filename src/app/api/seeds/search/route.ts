import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'newest'
    const skip = (page - 1) * limit

    // フィルター条件の構築
    const where: any = {}

    // テキスト検索
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { seedValue: { contains: search } },
        { comment: { contains: search, mode: 'insensitive' } }
      ]
    }

    // タグフィルター
    if (searchParams.get('owEase')) {
      where.owEase = searchParams.get('owEase')
    }

    if (searchParams.get('owTypes')) {
      const types = searchParams.getAll('owTypes')
      if (types.length > 0) {
        where.owTypes = { hasSome: types }
      }
    }

    if (searchParams.get('villageType')) {
      where.villageType = searchParams.get('villageType')
    }

    if (searchParams.get('hasBlacksmith')) {
      const value = searchParams.get('hasBlacksmith')
      where.hasBlacksmith = value === 'true'
    }

    if (searchParams.get('netherEase')) {
      where.netherEase = searchParams.get('netherEase')
    }

    if (searchParams.get('fortressDistance')) {
      where.fortressDistance = searchParams.get('fortressDistance')
    }

    if (searchParams.get('fortressTypes')) {
      const types = searchParams.getAll('fortressTypes')
      if (types.length > 0) {
        where.fortressTypes = { hasSome: types }
      }
    }

    if (searchParams.get('fortressToNetherDist')) {
      where.fortressToNetherDist = searchParams.get('fortressToNetherDist')
    }

    if (searchParams.get('portalRoomEase')) {
      where.portalRoomEase = searchParams.get('portalRoomEase')
    }

    if (searchParams.get('zeroCycle')) {
      where.zeroCycle = searchParams.get('zeroCycle')
    }

    // ソート条件
    const orderBy: any = {}
    switch (sort) {
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
      case 'likes':
        orderBy.likes = { _count: 'desc' }
        break
      default:
        orderBy.createdAt = 'desc'
    }

    const [seeds, total] = await Promise.all([
      prisma.seed.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { username: true, avatarUrl: true } },
          _count: { select: { likes: true } }
        }
      }),
      prisma.seed.count({ where })
    ])

    return NextResponse.json({
      seeds,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Search seeds error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
