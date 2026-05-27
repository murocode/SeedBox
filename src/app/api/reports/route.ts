import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { resolveCurrentUser } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || body.access_token || null
    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const category = typeof body.category === 'string' ? body.category : 'REPORT'
    if (!['CONTACT', 'BUG', 'FEATURE', 'REPORT'].includes(category)) {
      return NextResponse.json({ error: 'INVALID_CATEGORY' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'INVALID_MESSAGE' }, { status: 400 })
    }

    const targetSeedId = body.targetSeedId === undefined || body.targetSeedId === null ? null : Number(body.targetSeedId)
    const targetUsername = typeof body.targetUsername === 'string' ? body.targetUsername : null

    if (category === 'REPORT' && !targetSeedId && !targetUsername) {
      return NextResponse.json({ error: 'INVALID_TARGET' }, { status: 400 })
    }

    if (category === 'REPORT') {
      const existing = await prisma.report.findFirst({
        where: {
          reporterUsername: currentUser.username,
          targetSeedId,
          targetUsername
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'ALREADY_REPORTED' }, { status: 409 })
      }
    }

    const categoryLabelMap: Record<string, string> = {
      CONTACT: 'お問い合わせ',
      BUG: 'バグ報告',
      FEATURE: '機能リクエスト',
      REPORT: '通報'
    }

    const reason = ['MISINFO', 'SPAM', 'OTHER'].includes(body.reason) ? body.reason : 'OTHER'

    const report = await prisma.report.create({
      data: {
        reporterUsername: currentUser.username,
        targetSeedId: category === 'REPORT' ? targetSeedId : null,
        targetUsername: category === 'REPORT' ? targetUsername : null,
        reason,
        note: `[${categoryLabelMap[category]}] ${message}`.slice(0, 500)
      }
    })

    // do not expose internal user IDs to clients
    const safeReport = {
      id: report.id,
      targetSeedId: report.targetSeedId,
      reason: report.reason,
      note: report.note,
      createdAt: report.createdAt
    }

    return NextResponse.json({ report: safeReport }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}