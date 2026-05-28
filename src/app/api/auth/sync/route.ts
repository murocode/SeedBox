import { NextResponse } from "next/server"
import { supabaseServer } from "../../../../lib/supabaseServer"
import { prisma } from "../../../../lib/prisma"
import { buildUniqueUsername } from "../../../../lib/seed-domain"
import { getSupabaseProviders } from "../../../../lib/supabase-auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const access_token = body?.access_token
    const persist_oauth_accounts = body?.persist_oauth_accounts !== false
    const expected_email = typeof body?.expected_email === 'string' ? body.expected_email.trim().toLowerCase() : ''
    if (!access_token) return NextResponse.json({ error: "access_token required" }, { status: 400 })

    const { data, error } = await supabaseServer.auth.getUser(access_token)
    if (error || !data?.user) return NextResponse.json({ error: error?.message ?? "failed to get user" }, { status: 401 })
    const user = data.user

    const email = user.email ?? undefined
    if (persist_oauth_accounts && expected_email && email?.trim().toLowerCase() !== expected_email) {
      return NextResponse.json({ error: "EMAIL_MISMATCH" }, { status: 409 })
    }
    const meta = (user.user_metadata ?? {}) as any
    let username = (meta.name || meta.full_name || email?.split("@")[0] || `u_${user.id.slice(0, 6)}`).toLowerCase()
    username = username.replace(/[^a-zA-Z0-9_\-]/g, "")
    if (!username) {
      username = `u_${user.id.slice(0, 6)}`
    }

    let dbUser: any
    if (email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } })
      if (existingByEmail) {
        // Keep the app username stable after initial setup.
        dbUser = await prisma.user.update({
          where: { username: existingByEmail.username },
          data: {
            avatarUrl: meta.avatar_url ?? meta.picture ?? undefined
          }
        })
      } else {
        let candidateUsername = username
        while (await prisma.user.findUnique({ where: { username: candidateUsername } })) {
          candidateUsername = buildUniqueUsername(username)
        }

        dbUser = await prisma.user.create({
          data: {
            username: candidateUsername,
            email,
            avatarUrl: meta.avatar_url ?? meta.picture ?? undefined
          }
        })
      }
    } else {
      const providers = getSupabaseProviders(user)
      for (const provider of providers) {
        const existingOAuth = await prisma.oAuthAccount.findUnique({
          where: { provider_providerAccountId: { provider, providerAccountId: user.id } }
        }).catch(() => null)
        if (existingOAuth) {
          dbUser = await prisma.user.findUnique({ where: { username: existingOAuth.userUsername } })
          break
        }
      }

      if (!dbUser) {
        let candidateUsername = username
        while (await prisma.user.findUnique({ where: { username: candidateUsername } })) {
          candidateUsername = buildUniqueUsername(username)
        }

        dbUser = await prisma.user.create({
          data: {
            username: candidateUsername,
            avatarUrl: meta.avatar_url ?? meta.picture ?? undefined
          }
        })
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: "failed to sync user" }, { status: 500 })
    }

    if (persist_oauth_accounts) {
      const providerAccountId = user.id
      const providers = getSupabaseProviders(user)
      await Promise.all(
        providers.map(provider =>
          prisma.oAuthAccount.upsert({
            where: { provider_providerAccountId: { provider, providerAccountId } },
            update: { userUsername: dbUser.username },
            create: { provider, providerAccountId, userUsername: dbUser.username }
          }).catch(() => null)
        )
      )
    }

    const res = NextResponse.json({ ok: true, user: { username: dbUser.username } })

    // Set access token as an HttpOnly cookie so server-side components can read it
    const secure = process.env.NODE_ENV === 'production'
    res.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
