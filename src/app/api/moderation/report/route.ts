import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '../../../../lib/prisma'
import { resolveCurrentUser, hasModerationAccess } from '../../../../lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    // モデレーター認証確認
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const currentUser = await resolveCurrentUser(accessToken)
    if (!currentUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!hasModerationAccess(currentUser)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, action, removeSeeds } = body

    if (!reportId || !action) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { targetUser: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'REPORT_NOT_FOUND' }, { status: 404 })
    }

    // モデレーションログを作成
    const log = await prisma.moderationLog.create({
      data: {
        action,
        targetType: report.targetUsername ? 'user' : report.targetSeedId ? 'seed' : 'report',
        targetId: report.targetSeedId ?? null,
        note: report.reason,
        moderatorUsername: currentUser.username
      }
    })

    // アクションに応じた処理
    if (action === 'WARNING') {
      // 警告のみ - 投稿は残す
      await prisma.report.delete({ where: { id: reportId } })
    } else if (action === 'BAN') {
      // ユーザーをBANする（isBanned フィールドが必要）
      if (report.targetUsername) {
        await prisma.user.update({
          where: { username: report.targetUsername },
          data: { isBanned: true }
        })

        // BANの場合、指定されたシードを削除
        if (removeSeeds && Array.isArray(removeSeeds)) {
          await prisma.$transaction(async tx => {
            await tx.like.deleteMany({
              where: { seedId: { in: removeSeeds } }
            })
            await tx.favorite.deleteMany({
              where: { seedId: { in: removeSeeds } }
            })
            await tx.report.deleteMany({
              where: { targetSeedId: { in: removeSeeds } }
            })
            await tx.seed.deleteMany({
              where: { id: { in: removeSeeds } }
            })
          })
        }
      }
      await prisma.report.delete({ where: { id: reportId } })
    } else if (action === 'DISMISS') {
      // 却下 - 何もしない、通報を削除
      await prisma.report.delete({ where: { id: reportId } })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
