import 'server-only'

import { prisma } from './prisma'
import { supabaseServer } from './supabaseServer'
import { getSupabaseProviders } from './supabase-auth'

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'

export function normalizeEmail(email?: string | null) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function parseEmailList(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)
  )
}

function resolveRole(email?: string | null): UserRole {
  if (!email) {
    return 'USER'
  }

  const adminEmails = parseEmailList(process.env.ADMIN_EMAILS)
  if (adminEmails.has(email.toLowerCase())) {
    return 'ADMIN'
  }

  const moderatorEmails = parseEmailList(process.env.MODERATOR_EMAILS)
  if (moderatorEmails.has(email.toLowerCase())) {
    return 'MODERATOR'
  }

  return 'USER'
}

export async function resolveCurrentUser(accessToken?: string | null) {
  if (!accessToken) {
    return null
  }

  const { data, error } = await supabaseServer.auth.getUser(accessToken)
  if (error || !data?.user) {
    return null
  }

  const email = normalizeEmail(data.user.email)
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      return { ...user, role: resolveRole(user.email) }
    }
  }

  const providers = getSupabaseProviders(data.user)
  for (const provider of providers) {
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId: data.user.id } },
      include: { user: true }
    }).catch(() => null)

    if (oauthAccount?.user) {
      return { ...oauthAccount.user, role: resolveRole(oauthAccount.user.email) }
    }
  }

  return null
}

export function hasModerationAccess(user: { email?: string | null } | null | undefined) {
  const role = resolveRole(user?.email)
  return role === 'MODERATOR' || role === 'ADMIN'
}
