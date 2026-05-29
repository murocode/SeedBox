import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '../../../lib/prisma'
import { resolveCurrentUser } from '../../../lib/auth'
import {
  buildUniqueUsername,
  normalizeDistance,
  normalizeEase,
  normalizePortalEase,
  normalizeZeroCycle,
  parseBoolean,
  parseCsvList
} from '../../../lib/seed-domain'

export const dynamic = 'force-dynamic'

function parseSeedValue(seedValue: unknown) {
  if (typeof seedValue !== 'string' || !/^-?\d+$/.test(seedValue.trim())) {
    return null
  }

  try {
    const value = BigInt(seedValue.trim())
    const min = BigInt('-9223372036854775808')
    const max = BigInt('9223372036854775807')
    if (value < min || value > max) return null
    return seedValue.trim()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = url.searchParams

    const where: any = {}

    if (q.get('seedValue')) where.seedValue = q.get('seedValue')
    if (q.get('owEase')) where.owEase = normalizeEase(q.get('owEase'))
    if (q.get('netherEase')) where.netherEase = normalizeEase(q.get('netherEase'))
    if (q.get('fortressDistance')) where.fortressDistance = normalizeDistance(q.get('fortressDistance'))
    if (q.get('fortressToNetherDist')) where.fortressToNetherDist = normalizeDistance(q.get('fortressToNetherDist'))
    if (q.get('portalRoomEase')) where.portalRoomEase = normalizePortalEase(q.get('portalRoomEase'))
    if (q.get('zeroCycle')) where.zeroCycle = normalizeZeroCycle(q.get('zeroCycle'))
    if (q.get('villageType')) where.villageType = q.get('villageType')
    if (q.has('hasBlacksmith')) where.hasBlacksmith = parseBoolean(q.get('hasBlacksmith'))

    const owTypes = parseCsvList(q.getAll('owTypes'))
    if (owTypes.length > 0) where.owTypes = { hasSome: owTypes }

    const fortressTypes = parseCsvList(q.getAll('fortressTypes'))
    if (fortressTypes.length > 0) where.fortressTypes = { hasSome: fortressTypes }

    const searchText = q.get('query')?.trim() || q.get('search')?.trim()
    if (searchText) {
      where.OR = [
        { seedValue: { contains: searchText } },
        { title: { contains: searchText, mode: 'insensitive' } },
        { comment: { contains: searchText, mode: 'insensitive' } }
      ]
    }

    // author filter by username
    if (q.get('author')) {
      where.author = { username: q.get('author')?.toLowerCase() }
    }

    // フォロー中フィルター
    if (q.get('followingOnly') === 'true') {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get('sb-access-token')?.value
      
      if (accessToken) {
        const currentUser = await resolveCurrentUser(accessToken)
        if (currentUser) {
          where.author = {
            followers: {
              some: { followerUsername: currentUser.username }
            }
          }
        }
      }
    }

    const take = Math.min(100, Number(q.get('limit') || 20))
    const skip = Math.max(0, Number(q.get('offset') || 0))

    const orderByParam = q.get('orderBy') || 'createdAt'
    const orderDir = (q.get('orderDir') || 'desc') as 'asc' | 'desc'
    let orderBy: any = { createdAt: orderDir }
    if (orderByParam === 'seedValue') orderBy = { seedValue: orderDir }
    if (orderByParam === 'likes') orderBy = { likes: { _count: orderDir } }

    const include = {
      author: { select: { username: true, avatarUrl: true, speedrunId: true, pbTime: true } },
      _count: { select: { likes: true, favorites: true } }
    }

    // PBソートは作者の pbTime を基準に並べ替える。pbTime が null の投稿は末尾に回すため、
    // pbTime がある投稿とない投稿を別々に取得して連結し、最終的に skip/take で切り出す。
    if (orderByParam === 'pb') {
      // 総件数
      const total = await prisma.seed.count({ where })

      const baseWhere = where
      const withPbWhere = { ...(baseWhere || {}), AND: [ ...(baseWhere?.AND || []), { author: { pbTime: { not: null } } } ] }
      const nullPbWhere = { ...(baseWhere || {}), AND: [ ...(baseWhere?.AND || []), { author: { pbTime: null } } ] }

      const nonNullSeeds = await prisma.seed.findMany({
        where: withPbWhere,
        include,
        orderBy: { author: { pbTime: orderDir } },
        take: skip + take
      })

      const nullSeeds = await prisma.seed.findMany({
        where: nullPbWhere,
        include,
        // null の方は作成日時順に並べる
        orderBy: { createdAt: orderDir },
        take: skip + take
      })

      const combined = nonNullSeeds.concat(nullSeeds)
      const sliced = combined.slice(skip, skip + take)

      return NextResponse.json({ seeds: sliced, total, take, skip })
    }

    const seeds = await prisma.seed.findMany({
      where,
      include,
      take,
      skip,
      orderBy
    })

    return NextResponse.json({ seeds, total: seeds.length, take, skip })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const currentUser = await resolveCurrentUser(token || null)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const seedValue = parseSeedValue(body.seedValue)
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
    const comment = typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim().slice(0, 1000) : null
      const authorUsername = currentUser.username

    if (!seedValue) return NextResponse.json({ error: 'seedValue required' }, { status: 400 })


    const owEase = normalizeEase(body.owEase)
    const owTypes = parseCsvList(body.owTypes)
    const villageType = typeof body.villageType === 'string' && body.villageType ? body.villageType : null
    const hasBlacksmith = parseBoolean(body.hasBlacksmith)
    const netherEase = normalizeEase(body.netherEase)
    const fortressDistance = normalizeDistance(body.fortressDistance)
    const fortressTypes = parseCsvList(body.fortressTypes)
    const fortressToNetherDist = normalizeDistance(body.fortressNetherDistance)
    const portalRoomEase = normalizePortalEase(body.portalRoomEase)
    const zeroCycle = normalizeZeroCycle(body.zeroCycle)



    // prevent same user duplicate seed
    const exists = await prisma.seed.findFirst({ where: { seedValue, authorUsername } })
    if (exists) return NextResponse.json({ error: 'duplicate for same user' }, { status: 409 })

    const created = await prisma.seed.create({
      data: {
        seedValue,
        title,
        comment: comment ?? null,
        owEase,
        owTypes,
        villageType,
        hasBlacksmith,
        netherEase,
        fortressDistance,
        fortressTypes,
        fortressToNetherDist,
        portalRoomEase,
        zeroCycle,
        author: { connect: { username: authorUsername } },
      }
    })

    const seed = await prisma.seed.findUnique({
      where: { id: created.id },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        _count: { select: { likes: true, favorites: true } }
      }
    })

    return NextResponse.json({ seed }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
