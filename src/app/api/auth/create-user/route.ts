import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { buildUniqueUsername } from '../../../../lib/seed-domain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, avatarUrl, providerAccountId } = body
    const providers = Array.isArray(body?.providers)
      ? body.providers
      : body?.provider
        ? [body.provider]
        : []

    const normalizedProviders = Array.from(
      new Set(
        providers
          .map((value: unknown) => typeof value === 'string' ? value.trim() : '')
          .filter((value: string): value is string => !!value)
      )
    )
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''

    // リクエスト検証
    if (!normalizedUsername || !email) {
      return NextResponse.json(
        { error: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // リクエストのAuthorizationヘッダーからアクセストークンを取得
    const authorization = request.headers.get('authorization')
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null

    // メールアドレスで既存ユーザーを検索（自動名寄せ）
    const existingByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingByEmail) {
      // 既存ユーザーがいる場合、OAuthアカウント連携を追加
      if (providerAccountId && normalizedProviders.length > 0) {
        await Promise.all(
          normalizedProviders.map(provider =>
            prisma.oAuthAccount.upsert({
              where: { provider_providerAccountId: { provider, providerAccountId } },
              update: { userUsername: existingByEmail.username },
              create: {
                provider,
                providerAccountId,
                userUsername: existingByEmail.username
              }
            }).catch(() => null)
          )
        )
      }

      const updated = await prisma.user.update({
        where: { username: existingByEmail.username },
        data: {
          avatarUrl: avatarUrl || existingByEmail.avatarUrl
        }
      })

      const safeUpdated = {
        username: updated.username,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        oauthAccounts: (updated as any).oauthAccounts ?? []
      }

      return NextResponse.json({ user: safeUpdated, isNewUser: false })
    }

    // 新規ユーザーの場合、ユーザー名の重複チェック
    let candidateUsername = normalizedUsername

    const existingUser = await prisma.user.findUnique({
      where: { username: candidateUsername }
    })

    if (existingUser) {
      // ユーザー名が重複している場合
      candidateUsername = buildUniqueUsername(normalizedUsername)
      
      return NextResponse.json(
        { 
          error: 'USERNAME_TAKEN',
          suggestedUsername: candidateUsername 
        },
        { status: 409 }
      )
    }

    // 新規ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        username: candidateUsername,
        email,
        avatarUrl: avatarUrl || null
      },
      include: { oauthAccounts: { select: { provider: true } } }
    })

    if (providerAccountId && normalizedProviders.length > 0) {
      await Promise.all(
        normalizedProviders.map(provider =>
          prisma.oAuthAccount.upsert({
            where: { provider_providerAccountId: { provider, providerAccountId } },
            update: { userUsername: newUser.username },
            create: {
              provider,
              providerAccountId,
              userUsername: newUser.username
            }
          }).catch(() => null)
        )
      )
    }

    const safeNewUser = {
      username: newUser.username,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      oauthAccounts: newUser.oauthAccounts ?? []
    }

    const res = NextResponse.json({ user: safeNewUser, isNewUser: true }, { status: 201 })

    // Set access token as an HttpOnly cookie if provided
    if (accessToken) {
      const secure = process.env.NODE_ENV === 'production'
      res.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    return res
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
