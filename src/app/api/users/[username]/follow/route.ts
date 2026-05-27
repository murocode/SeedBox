import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../../lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (targetUser.username === currentUser.username) {
      return NextResponse.json({ error: 'CANNOT_FOLLOW_SELF' }, { status: 400 })
    }

    await prisma.follow.upsert({
      where: {
        followerUsername_followingUsername: {
          followerUsername: currentUser.username,
          followingUsername: targetUser.username
        }
      },
      update: {},
      create: {
        followerUsername: currentUser.username,
        followingUsername: targetUser.username
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.follow.deleteMany({
      where: { followerUsername: currentUser.username, followingUsername: targetUser.username }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
    const currentUser = accessToken ? await resolveCurrentUser(accessToken) : null

    const targetUser = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
    if (!targetUser) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (!currentUser) {
      return NextResponse.json({ following: false })
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerUsername_followingUsername: {
          followerUsername: currentUser.username,
          followingUsername: targetUser.username
        }
      }
    })

    return NextResponse.json({ following: Boolean(existing) })
  } catch (error) {
    console.error('Follow GET error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
