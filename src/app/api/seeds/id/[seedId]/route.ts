import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../../lib/auth'

function toNumber(v: any) {
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export async function GET(request: Request, { params }: { params: Promise<{ seedId: string }> }) {
  try {
    const { seedId } = await params
    const id = toNumber(seedId)
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

    const seed = await prisma.seed.findUnique({
      where: { id },
      include: { author: { select: { username: true, avatarUrl: true } }, likes: true, favorites: true }
    })
    if (!seed) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ seed })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ seedId: string }> }) {
  try {
    const { seedId } = await params
    const id = toNumber(seedId)
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const currentUser = await resolveCurrentUser(token || null)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    // 投稿の所有者確認
    const seed = await prisma.seed.findUnique({ where: { id } })
    if (!seed) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (seed.authorUsername !== currentUser.username) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await request.json()

    // 更新データの構築
    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.comment !== undefined) data.comment = body.comment
    if (body.owEase !== undefined) data.owEase = body.owEase
    if (body.owTypes !== undefined) data.owTypes = body.owTypes
    if (body.villageType !== undefined) data.villageType = body.villageType
    if (body.hasBlacksmith !== undefined) data.hasBlacksmith = body.hasBlacksmith
    if (body.netherEase !== undefined) data.netherEase = body.netherEase
    if (body.fortressDistance !== undefined) data.fortressDistance = body.fortressDistance
    if (body.fortressTypes !== undefined) data.fortressTypes = body.fortressTypes
    if (body.fortressToNetherDist !== undefined) data.fortressToNetherDist = body.fortressToNetherDist
    if (body.portalRoomEase !== undefined) data.portalRoomEase = body.portalRoomEase
    if (body.zeroCycle !== undefined) data.zeroCycle = body.zeroCycle

    const updated = await prisma.seed.update({ 
      where: { id }, 
      data,
      include: {
        author: { select: { username: true, avatarUrl: true } }
      }
    })
    return NextResponse.json({ seed: updated })
  } catch (err: any) {
    console.error(err)
    if (err.code === 'P2025') return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ seedId: string }> }) {
  try {
    const { seedId } = await params
    const id = toNumber(seedId)
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const currentUser = await resolveCurrentUser(token || null)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    // 投稿の所有者確認
    const seed = await prisma.seed.findUnique({ where: { id } })
    if (!seed) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (seed.authorUsername !== currentUser.username) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    await prisma.seed.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    if (err.code === 'P2025') return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
