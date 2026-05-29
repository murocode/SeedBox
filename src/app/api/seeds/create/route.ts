import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const currentUser = await resolveCurrentUser(token || null)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      seedValue,
      title,
      comment,
      owEase,
      owTypes,
      villageType,
      hasBlacksmith,
      netherEase,
      fortressDistance,
      fortressTypes,
      fortressToNetherDist,
      portalRoomEase,
      zeroCycle
    } = body

    const authorUsername = currentUser.username

    // バリデーション
    if (!seedValue || !authorUsername) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }


    // Seed値は整数のみ
    if (!/^-?\d+$/.test(seedValue)) {
      return NextResponse.json(
        { error: 'INVALID_SEED_VALUE' },
        { status: 400 }
      )
    }


    // 同一ユーザーによる同一Seed値の重複投稿チェック
    const existingSeed = await prisma.seed.findFirst({
      where: {
        seedValue,
        authorUsername
      }
    })

    if (existingSeed) {
      return NextResponse.json(
        { error: 'DUPLICATE_SEED_BY_USER' },
        { status: 409 }
      )
    }

    // シード投稿作成
    const seed = await prisma.seed.create({
      data: {
        seedValue,
        title: title || null,
        comment: comment || null,
        authorUsername,
        owEase: owEase || null,
        owTypes: owTypes || [],
        villageType: villageType || null,
        hasBlacksmith: hasBlacksmith !== undefined ? hasBlacksmith : null,
        netherEase: netherEase || null,
        fortressDistance: fortressDistance || null,
        fortressTypes: fortressTypes || [],
        fortressToNetherDist: fortressToNetherDist || null,
        portalRoomEase: portalRoomEase || null,
        zeroCycle: zeroCycle || null
      },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ seed })
  } catch (error) {
    console.error('Create seed error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
