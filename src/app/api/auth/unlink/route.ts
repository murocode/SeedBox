import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null

    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const provider = typeof body.provider === 'string' ? body.provider : null
    if (!provider) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    // fetch all linked providers for this user
    const linked = await prisma.oAuthAccount.findMany({ where: { userUsername: currentUser.username } })

    if (!linked || linked.length === 0) {
      return NextResponse.json({ error: 'NO_LINKED_PROVIDERS' }, { status: 400 })
    }

    // If only one provider is linked, disallow unlinking
    if (linked.length === 1) {
      return NextResponse.json({ error: 'CANNOT_UNLINK_LAST_PROVIDER' }, { status: 400 })
    }

    // delete the provider record for this user
    await prisma.oAuthAccount.deleteMany({ where: { userUsername: currentUser.username, provider } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unlink provider error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
