import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { fetchSpeedrunPB, fetchSpeedrunUsername } from '../../../../lib/speedrun'

// Cron endpoint to sync speedrun PBs (authenticated in production)
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization')

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: { speedrunId: { not: null } },
      select: { username: true, speedrunId: true }
    })

    let successCount = 0
    let errorCount = 0
    const results = []

    for (const user of users) {
      if (!user.speedrunId) continue

      const pbTime = await fetchSpeedrunPB(user.speedrunId)

      if (pbTime !== null) {
        await prisma.user.update({
          where: { username: user.username },
          data: {
            pbTime,
            pbUpdatedAt: new Date()
          }
        })

        const srName = await fetchSpeedrunUsername(user.speedrunId)
        console.log(`PB updated for ${user.username} (speedrun: ${srName ?? user.speedrunId}): ${pbTime}s`)

        successCount++
        results.push({ username: user.username, pbTime, speedrunName: srName, status: 'updated' })
      } else {
        errorCount++
        results.push({ username: user.username, status: 'failed' })
      }

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