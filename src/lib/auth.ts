import { prisma } from './prisma'
import { supabaseServer } from './supabaseServer'

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'

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

  const email = data.user.email ?? null
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

export function getSupabaseProviders(user: { identities?: Array<{ provider?: string | null }> | null; app_metadata?: { provider?: string | null } | null }) {
  const providers = (user.identities ?? [])
    .map(identity => identity?.provider?.trim())
    .filter((provider): provider is string => !!provider)

  const fallbackProvider = user.app_metadata?.provider?.trim()
  if (fallbackProvider) {
    providers.push(fallbackProvider)
  }

  if (providers.length === 0) {
    providers.push('supabase')
  }

  return Array.from(new Set(providers))
}

export function hasModerationAccess(user: { email?: string | null } | null | undefined) {
  const role = resolveRole(user?.email)
  return role === 'MODERATOR' || role === 'ADMIN'
}
