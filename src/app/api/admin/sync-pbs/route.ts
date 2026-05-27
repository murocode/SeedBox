import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { fetchSpeedrunPB, fetchSpeedrunUsername } from '../../../../lib/speedrun'
import { cookies } from 'next/headers'
import { resolveCurrentUser, hasModerationAccess } from '../../../../lib/auth'

async function resolveAccessToken(request: Request) {
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

// 管理画面から手動でPBを同期する安全なエンドポイント（POST）
export async function POST(request: Request) {
  try {
    const accessToken = await resolveAccessToken(request)
    const currentUser = await resolveCurrentUser(accessToken)

    if (!accessToken || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasModerationAccess(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: { speedrunId: { not: null } },
      select: { username: true, speedrunId: true }
    })

    let successCount = 0
    let errorCount = 0
    const results: any[] = []

    for (const user of users) {
      if (!user.speedrunId) continue

      try {
        const pbTime = await fetchSpeedrunPB(user.speedrunId)

        if (pbTime !== null) {
          await prisma.user.update({
            where: { username: user.username },
            data: { pbTime, pbUpdatedAt: new Date() }
          })

          const srName = await fetchSpeedrunUsername(user.speedrunId)
          console.log(`PB updated for ${user.username} (speedrun: ${srName ?? user.speedrunId}): ${pbTime}s`)

          successCount++
          results.push({ username: user.username, pbTime, speedrunName: srName, status: 'updated' })
        } else {
          errorCount++
          results.push({ username: user.username, status: 'failed', reason: 'pb-not-found' })
        }
      } catch (error) {
        errorCount++
        console.error('PB sync user failed:', user.username, error)
        results.push({ username: user.username, status: 'failed', reason: String(error) })
      }

      // 短いウェイトでrate limit緩和
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      message: 'PB sync completed',
      total: users.length,
      successCount,
      errorCount,
      results
    })
  } catch (error) {
    console.error('PB sync error:', error)
    return NextResponse.json({ error: 'sync failed', details: String(error) }, { status: 500 })
  }
}
