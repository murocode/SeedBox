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