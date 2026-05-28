import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        following: { select: { id: true } },
        followers: { select: { id: true } },
        seeds: {
          select: { id: true }
        },
        oauthAccounts: {
          select: { provider: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // ログイン状態の確認
    let isFollowing = false
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const accessToken = authHeader.replace(/^Bearer\s+/i, '')
      const currentUser = await resolveCurrentUser(accessToken)
      if (currentUser) {
          const follow = await prisma.follow.findUnique({ where: { followerUsername_followingUsername: { followerUsername: currentUser.username, followingUsername: user.username } } }).catch(() => null)
        isFollowing = !!follow
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        seedCount: user.seeds.length,
        followingCount: user.following.length,
        followerCount: user.followers.length,
        providers: user.oauthAccounts.map(account => account.provider)
      },
      isFollowing
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
