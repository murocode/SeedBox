import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../lib/auth'
import { validateUrl, validateBio, validateComment } from '../../../../lib/validation'
import { ACCOUNT_USER_COOKIE_NAME, serializeAccountCookieUser } from '../../../../lib/account-cookie'

async function resolveAccessToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim()
    if (token) {
      return token
    }
  }

  const cookieStore = await cookies()
  return cookieStore.get('sb-access-token')?.value ?? null
}

export async function GET(request: NextRequest) {
  try {
    // Ensure authentication
    const accessToken = await resolveAccessToken(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username: currentUser.username },
      include: {
        oauthAccounts: { select: { provider: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Omit internal IDs before returning to clients
    const safeUser = {
      username: user.username,
      email: user.email,
      role: currentUser.role,
      bio: user.bio,
      youtubeUrl: user.youtubeUrl,
      xUrl: user.xUrl,
      twitchUrl: user.twitchUrl,
      websiteUrl: user.websiteUrl,
      speedrunId: user.speedrunId,
      avatarUrl: user.avatarUrl,
      oauthAccounts: user.oauthAccounts ?? []
    }

    const response = NextResponse.json({ user: safeUser })
    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set(ACCOUNT_USER_COOKIE_NAME, serializeAccountCookieUser({
      username: safeUser.username,
      email: safeUser.email,
      avatarUrl: safeUser.avatarUrl,
      role: safeUser.role
    }), {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure,
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Ensure authentication
    const accessToken = await resolveAccessToken(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { bio, youtubeUrl, xUrl, twitchUrl, websiteUrl, speedrunId } = body

    // 繝舌Μ繝・・ｽE繧ｷ繝ｧ繝ｳ
    if (bio && !validateBio(bio)) {
      return NextResponse.json({ error: 'BIO_TOO_LONG' }, { status: 400 })
    }

    if (!validateUrl(youtubeUrl)) {
      return NextResponse.json({ error: 'INVALID_YOUTUBE_URL' }, { status: 400 })
    }

    if (!validateUrl(xUrl)) {
      return NextResponse.json({ error: 'INVALID_X_URL' }, { status: 400 })
    }

    if (!validateUrl(twitchUrl)) {
      return NextResponse.json({ error: 'INVALID_TWITCH_URL' }, { status: 400 })
    }

    if (!validateUrl(websiteUrl)) {
      return NextResponse.json({ error: 'INVALID_WEBSITE_URL' }, { status: 400 })
    }

    const updateData: any = {}
    if (bio !== undefined) updateData.bio = bio
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl
    if (xUrl !== undefined) updateData.xUrl = xUrl
    if (twitchUrl !== undefined) updateData.twitchUrl = twitchUrl
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl
    if (speedrunId !== undefined) updateData.speedrunId = speedrunId

    const user = await prisma.user.update({
      where: { username: currentUser.username },
      data: updateData,
      include: { oauthAccounts: { select: { provider: true } } }
    })

    const safeUser = {
      username: user.username,
      email: user.email,
      role: currentUser.role,
      bio: user.bio,
      youtubeUrl: user.youtubeUrl,
      xUrl: user.xUrl,
      twitchUrl: user.twitchUrl,
      websiteUrl: user.websiteUrl,
      speedrunId: user.speedrunId,
      avatarUrl: user.avatarUrl,
      oauthAccounts: user.oauthAccounts ?? []
    }

    const response = NextResponse.json({ user: safeUser })
    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set(ACCOUNT_USER_COOKIE_NAME, serializeAccountCookieUser({
      username: safeUser.username,
      email: safeUser.email,
      avatarUrl: safeUser.avatarUrl,
      role: safeUser.role
    }), {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure,
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

