import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { buildUniqueUsername } from '../../../../lib/seed-domain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const base = typeof body.base === 'string' && body.base.trim() ? body.base.trim() : ''

    if (!base) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    // normalize base similar to buildUniqueUsername
    const normalized = base
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/^[^a-z0-9]+/, '')
      .slice(0, 20) || 'user'

    let candidate = normalized
    let attempts = 0
    while (attempts < 20) {
      const exists = await prisma.user.findUnique({ where: { username: candidate } })
      if (!exists) break
      candidate = buildUniqueUsername(normalized)
      attempts++
    }

    return NextResponse.json({ username: candidate })
  } catch (error) {
    console.error('Suggest username error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
